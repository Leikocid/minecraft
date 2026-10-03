// The UFO magnet's iron lists (src/ufo/iron.ts) against UFO §4/§5 and against
// the ids BDS 1.26.51.1 actually has. The snapshot below is every item, block
// and entity type id the engine reported that looks iron-related
// (ItemTypes/BlockTypes/EntityTypes.getAll() filtered by name, GameTest on
// BDS 1.26.51.1); the expected lists are derived from it by the spec's own
// words, not copied from the module. The in-engine half is
// andrew:ufo_iron_ids_resolve in src/gametest/ufo-magnet-select.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const bundle = await build({
  stdin: { contents: "export * from './src/ufo/iron.ts';", resolveDir: projectRoot, loader: 'ts' },
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  write: false,
});
const iron = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const { IRON_ITEMS, BLOCK_ITEMS, IRON_ORE, CONTAINER_BLOCKS, PAIRED_CHESTS, IRON_ENTITY_TYPES, IRON_ARMOUR, SCAN_TYPES, HOPPER, blockRole, itemForBlock, isIronItem, isIronEntityType } = iron;

const ids = (text) => new Set(text.trim().split(/\s+/).map((id) => `minecraft:${id}`));
const mc = (id) => `minecraft:${id}`;
const sorted = (set) => [...set].sort();

const ITEMS_1_26_51 = ids(`
  acacia_chest_boat acacia_door acacia_pressure_plate acacia_trapdoor activator_rail anvil armor_stand
  axolotl_bucket bamboo_chest_raft bamboo_door bamboo_pressure_plate bamboo_trapdoor barrel birch_chest_boat
  birch_door birch_pressure_plate birch_trapdoor black_shulker_box blast_furnace blue_shulker_box brewing_stand
  brown_shulker_box bucket cauldron chain_command_block chainmail_boots chainmail_chestplate chainmail_helmet
  chainmail_leggings cherry_chest_boat cherry_door cherry_pressure_plate cherry_trapdoor chest chest_minecart
  chipped_anvil cod_bucket command_block_minecart compass copper_bars copper_chain copper_chest
  copper_chestplate copper_door copper_golem_spawn_egg copper_golem_statue copper_lantern copper_nugget
  copper_trapdoor crafter crimson_door crimson_pressure_plate crimson_trapdoor crossbow cyan_shulker_box
  damaged_anvil dark_oak_chest_boat dark_oak_door dark_oak_pressure_plate dark_oak_trapdoor deepslate_iron_ore
  detector_rail diamond_chestplate dispenser dropper ender_chest exposed_copper_bars exposed_copper_chain
  exposed_copper_chest exposed_copper_door exposed_copper_golem_statue exposed_copper_lantern
  exposed_copper_trapdoor flint flint_and_steel furnace gold_nugget golden_chestplate golden_rail
  gray_shulker_box green_shulker_box heavy_weighted_pressure_plate hopper hopper_minecart iron_axe iron_bars
  iron_block iron_boots iron_chain iron_chestplate iron_door iron_golem_spawn_egg iron_helmet iron_hoe
  iron_horse_armor iron_ingot iron_leggings iron_nautilus_armor iron_nugget iron_ore iron_pickaxe iron_shovel
  iron_spear iron_sword iron_trapdoor jungle_chest_boat jungle_door jungle_pressure_plate jungle_trapdoor
  lantern lava_bucket leather_chestplate light_blue_shulker_box light_gray_shulker_box
  light_weighted_pressure_plate lime_shulker_box lodestone_compass magenta_shulker_box mangrove_chest_boat
  mangrove_door mangrove_pressure_plate mangrove_trapdoor milk_bucket minecart netherite_chestplate
  oak_chest_boat orange_shulker_box oxidized_copper_bars oxidized_copper_chain oxidized_copper_chest
  oxidized_copper_door oxidized_copper_golem_statue oxidized_copper_lantern oxidized_copper_trapdoor
  pale_oak_chest_boat pale_oak_door pale_oak_pressure_plate pale_oak_trapdoor pink_shulker_box
  polished_blackstone_pressure_plate poplar_chest_boat poplar_door poplar_pressure_plate poplar_trapdoor
  powder_snow_bucket pufferfish_bucket purple_shulker_box rail raw_iron raw_iron_block recovery_compass
  red_shulker_box salmon_bucket sea_lantern shears shield shulker_shell shulker_spawn_egg smoker
  snow_golem_spawn_egg soul_lantern spruce_chest_boat spruce_door spruce_pressure_plate spruce_trapdoor
  stone_pressure_plate sulfur_cube_bucket tadpole_bucket tnt_minecart trapdoor trapped_chest
  tropical_fish_bucket undyed_shulker_box warped_door warped_pressure_plate warped_trapdoor water_bucket
  waxed_copper_bars waxed_copper_chain waxed_copper_chest waxed_copper_door waxed_copper_golem_statue
  waxed_copper_lantern waxed_copper_trapdoor waxed_exposed_copper_bars waxed_exposed_copper_chain
  waxed_exposed_copper_chest waxed_exposed_copper_door waxed_exposed_copper_golem_statue
  waxed_exposed_copper_lantern waxed_exposed_copper_trapdoor waxed_oxidized_copper_bars
  waxed_oxidized_copper_chain waxed_oxidized_copper_chest waxed_oxidized_copper_door
  waxed_oxidized_copper_golem_statue waxed_oxidized_copper_lantern waxed_oxidized_copper_trapdoor
  waxed_weathered_copper_bars waxed_weathered_copper_chain waxed_weathered_copper_chest
  waxed_weathered_copper_door waxed_weathered_copper_golem_statue waxed_weathered_copper_lantern
  waxed_weathered_copper_trapdoor weathered_copper_bars weathered_copper_chain weathered_copper_chest
  weathered_copper_door weathered_copper_golem_statue weathered_copper_lantern weathered_copper_trapdoor
  white_shulker_box wooden_door wooden_pressure_plate yellow_shulker_box
`);

const BLOCKS_1_26_51 = ids(`
  acacia_door acacia_pressure_plate acacia_trapdoor activator_rail anvil bamboo_door bamboo_pressure_plate
  bamboo_trapdoor barrel birch_door birch_pressure_plate birch_trapdoor black_shulker_box blast_furnace
  blue_shulker_box brewing_stand brown_shulker_box cauldron chain_command_block cherry_door
  cherry_pressure_plate cherry_trapdoor chest chipped_anvil copper_bars copper_chain copper_chest copper_door
  copper_golem_statue copper_lantern copper_trapdoor crafter crimson_door crimson_pressure_plate
  crimson_trapdoor cyan_shulker_box damaged_anvil dark_oak_door dark_oak_pressure_plate dark_oak_trapdoor
  deepslate_iron_ore deprecated_anvil detector_rail dispenser dropper ender_chest exposed_copper_bars
  exposed_copper_chain exposed_copper_chest exposed_copper_door exposed_copper_golem_statue
  exposed_copper_lantern exposed_copper_trapdoor furnace golden_rail gray_shulker_box green_shulker_box
  heavy_weighted_pressure_plate hopper iron_bars iron_block iron_chain iron_door iron_ore iron_trapdoor
  jungle_door jungle_pressure_plate jungle_trapdoor lantern light_blue_shulker_box light_gray_shulker_box
  light_weighted_pressure_plate lime_shulker_box lit_blast_furnace lit_furnace lit_smoker magenta_shulker_box
  mangrove_door mangrove_pressure_plate mangrove_trapdoor orange_shulker_box oxidized_copper_bars
  oxidized_copper_chain oxidized_copper_chest oxidized_copper_door oxidized_copper_golem_statue
  oxidized_copper_lantern oxidized_copper_trapdoor pale_oak_door pale_oak_pressure_plate pale_oak_trapdoor
  pink_shulker_box polished_blackstone_pressure_plate poplar_door poplar_pressure_plate poplar_trapdoor
  purple_shulker_box rail raw_iron_block red_shulker_box sea_lantern smoker soul_lantern spruce_door
  spruce_pressure_plate spruce_trapdoor stone_pressure_plate trapdoor trapped_chest undyed_shulker_box
  warped_door warped_pressure_plate warped_trapdoor waxed_copper_bars waxed_copper_chain waxed_copper_chest
  waxed_copper_door waxed_copper_golem_statue waxed_copper_lantern waxed_copper_trapdoor
  waxed_exposed_copper_bars waxed_exposed_copper_chain waxed_exposed_copper_chest waxed_exposed_copper_door
  waxed_exposed_copper_golem_statue waxed_exposed_copper_lantern waxed_exposed_copper_trapdoor
  waxed_oxidized_copper_bars waxed_oxidized_copper_chain waxed_oxidized_copper_chest waxed_oxidized_copper_door
  waxed_oxidized_copper_golem_statue waxed_oxidized_copper_lantern waxed_oxidized_copper_trapdoor
  waxed_weathered_copper_bars waxed_weathered_copper_chain waxed_weathered_copper_chest
  waxed_weathered_copper_door waxed_weathered_copper_golem_statue waxed_weathered_copper_lantern
  waxed_weathered_copper_trapdoor weathered_copper_bars weathered_copper_chain weathered_copper_chest
  weathered_copper_door weathered_copper_golem_statue weathered_copper_lantern weathered_copper_trapdoor
  white_shulker_box wooden_door wooden_pressure_plate yellow_shulker_box
`);

const ENTITIES_1_26_51 = ids(`
  armor_stand chest_boat chest_minecart command_block_minecart copper_golem hopper_minecart iron_golem minecart
  shulker shulker_bullet snow_golem tnt_minecart
`);

/** UFO §4 items as the spec names them; `chain` is `iron_chain` on 1.26.51. */
const SPEC_ITEMS = [
  'iron_ingot', 'iron_nugget', 'raw_iron', 'iron_block', 'raw_iron_block', 'iron_ore', 'deepslate_iron_ore',
  'iron_horse_armor', 'bucket', 'shears', 'flint_and_steel', 'compass', 'shield', 'crossbow',
  'iron_door', 'iron_trapdoor', 'iron_bars', 'anvil', 'cauldron', 'hopper', 'heavy_weighted_pressure_plate',
  'chain', 'lantern', 'soul_lantern',
];
const SPEC_BLOCKS = [
  'iron_block', 'raw_iron_block', 'iron_bars', 'iron_door', 'iron_trapdoor', 'anvil', 'cauldron', 'hopper',
  'heavy_weighted_pressure_plate', 'chain', 'lantern', 'soul_lantern',
];
const RENAMED_ON_1_26_51 = { chain: 'iron_chain' };
const on12651 = (name) => mc(RENAMED_ON_1_26_51[name] ?? name);

const pick = (snapshot, re) => [...snapshot].filter((id) => re.test(id.replace('minecraft:', '')));

/** §4 items, expanded over the 1.26.51 snapshot by the spec's "all …" groups. */
function expectedItems() {
  return new Set([
    ...SPEC_ITEMS.map(on12651),
    ...pick(ITEMS_1_26_51, /^iron_(sword|pickaxe|axe|shovel|hoe|spear)$/), // all iron tools and weapons
    ...pick(ITEMS_1_26_51, /^iron_(helmet|chestplate|leggings|boots|nautilus_armor)$/), // all iron armour
    ...pick(ITEMS_1_26_51, /_bucket$/), // every bucket with contents
    ...pick(ITEMS_1_26_51, /minecart$/), // all minecarts
    ...pick(ITEMS_1_26_51, /(^|_)rail$/), // all rails
    ...pick(ITEMS_1_26_51, /^(chipped_|damaged_)?anvil$/), // every anvil damage
    mc('lodestone_compass'), // a compass bound to a lodestone; recovery_compass is another item
  ]);
}

test('every id the module names exists on BDS 1.26.51.1', () => {
  const absent = [
    ...[...IRON_ITEMS].filter((id) => !ITEMS_1_26_51.has(id)).map((id) => `item ${id}`),
    ...[...BLOCK_ITEMS.values()].filter((id) => !ITEMS_1_26_51.has(id)).map((id) => `block item ${id}`),
    ...IRON_ARMOUR.filter(({ item }) => !ITEMS_1_26_51.has(item)).map(({ item }) => `armour ${item}`),
    ...[...BLOCK_ITEMS.keys(), ...IRON_ORE, ...CONTAINER_BLOCKS].filter((id) => !BLOCKS_1_26_51.has(id)).map((id) => `block ${id}`),
    ...[...IRON_ENTITY_TYPES].filter((id) => !ENTITIES_1_26_51.has(id)).map((id) => `entity ${id}`),
  ];
  assert.deepEqual(absent, []);
});

test('the spec names an id 1.26.51 renamed: chain is iron_chain', () => {
  assert.ok(!ITEMS_1_26_51.has(mc('chain')) && !BLOCKS_1_26_51.has(mc('chain')), 'minecraft:chain exists after all');
  assert.ok(isIronItem(mc('iron_chain')));
  assert.equal(itemForBlock(mc('iron_chain')), mc('iron_chain'));
});

test('IRON_ITEMS is exactly UFO §4 over the 1.26.51 ids', () => {
  assert.deepEqual(sorted(IRON_ITEMS), sorted(expectedItems()));
});

test('every iron-looking 1.26.51 item outside the list is not iron by §4', () => {
  const outside = [...ITEMS_1_26_51].filter((id) => !IRON_ITEMS.has(id));
  const notIron = /^minecraft:((waxed_)?(exposed_|weathered_|oxidized_)?copper_|chainmail_|(diamond|golden|leather|netherite)_chestplate$|gold_nugget$|flint$|recovery_compass$|sea_lantern$|light_weighted_pressure_plate$|.*_spawn_egg$|armor_stand$|chain_command_block$|shulker_shell$)/;
  const wooden = /^minecraft:(.*_(door|trapdoor|pressure_plate|chest_boat|chest_raft)|trapdoor|wooden_door)$/;
  const containerItems = /^minecraft:(chest|trapped_chest|ender_chest|barrel|furnace|blast_furnace|smoker|dispenser|dropper|brewing_stand|crafter|.*shulker_box)$/;
  const unexplained = outside.filter((id) => !notIron.test(id) && !wooden.test(id) && !containerItems.test(id));
  assert.deepEqual(unexplained, []);
  for (const id of ['copper_chain', 'copper_lantern', 'copper_bars', 'chainmail_helmet', 'recovery_compass', 'iron_golem_spawn_egg', 'gold_nugget']) {
    assert.ok(!isIronItem(mc(id)), `${id} must not be iron`);
  }
});

test('built blocks are UFO §4 blocks over the 1.26.51 ids, each giving its own item', () => {
  const expected = new Set([
    ...SPEC_BLOCKS.map(on12651),
    ...pick(BLOCKS_1_26_51, /(^|_)rail$/),
    ...pick(BLOCKS_1_26_51, /anvil$/),
  ]);
  assert.deepEqual(sorted(BLOCK_ITEMS.keys()), sorted(expected));
  for (const [block, item] of BLOCK_ITEMS) {
    if (block === mc('deprecated_anvil')) continue;
    assert.equal(item, block, `${block} gives ${item}`);
  }
  // No item of its own on 1.26.51 (the engine reports an unregistered id): the most worn anvil.
  assert.ok(!ITEMS_1_26_51.has(mc('deprecated_anvil')));
  assert.equal(itemForBlock(mc('deprecated_anvil')), mc('damaged_anvil'));
});

test('ore gives one raw_iron; nothing else is ore', () => {
  assert.deepEqual(sorted(IRON_ORE), [mc('deepslate_iron_ore'), mc('iron_ore')]);
  assert.equal(itemForBlock(mc('iron_ore')), mc('raw_iron'));
  assert.equal(itemForBlock(mc('deepslate_iron_ore')), mc('raw_iron'));
  assert.equal(itemForBlock(mc('raw_iron_block')), mc('raw_iron_block'));
  assert.equal(itemForBlock(mc('stone')), undefined);
  assert.equal(itemForBlock(mc('chest')), undefined);
});

test('containers are the §5 list over 1.26.51: lit furnaces, every shulker box and chest; never the crafter', () => {
  const expected = new Set([
    ...['chest', 'trapped_chest', 'barrel', 'hopper', 'dispenser', 'dropper', 'brewing_stand'].map(mc),
    ...pick(BLOCKS_1_26_51, /^(lit_)?(furnace|blast_furnace|smoker)$/),
    ...pick(BLOCKS_1_26_51, /shulker_box$/),
    ...pick(BLOCKS_1_26_51, /copper_chest$/),
  ]);
  assert.deepEqual(sorted(CONTAINER_BLOCKS), sorted(expected));
  assert.equal(pick(BLOCKS_1_26_51, /shulker_box$/).length, 17);
  for (const id of ['crafter', 'ender_chest', 'copper_golem_statue']) assert.ok(!CONTAINER_BLOCKS.has(mc(id)), id);
  for (const id of ['chest', 'trapped_chest', 'copper_chest', 'waxed_oxidized_copper_chest']) assert.ok(PAIRED_CHESTS.has(mc(id)), id);
  assert.ok(!PAIRED_CHESTS.has(mc('barrel')));
});

test('a hopper with anything in it is a container, an empty one a built block (L0-lgnd-cx13)', () => {
  assert.equal(blockRole(HOPPER, () => true), 'built');
  assert.equal(blockRole(HOPPER, () => false), 'container');
  assert.equal(itemForBlock(HOPPER), HOPPER);
  let asked = 0;
  const ask = () => (asked++, true);
  assert.equal(blockRole(mc('chest'), ask), 'container');
  assert.equal(blockRole(mc('iron_block'), ask), 'built');
  assert.equal(blockRole(mc('iron_ore'), ask), 'ore');
  assert.equal(blockRole(mc('stone'), ask), undefined);
  assert.equal(asked, 0, 'only a hopper asks for its contents');
});

test('entities: the iron golem, every minecart, and iron armour in the four armour slots only', () => {
  assert.deepEqual(sorted(IRON_ENTITY_TYPES), sorted([mc('iron_golem'), ...pick(ENTITIES_1_26_51, /minecart$/)]));
  for (const id of ['copper_golem', 'snow_golem', 'armor_stand', 'zombie', 'chest_boat']) assert.ok(!isIronEntityType(mc(id)), id);
  assert.deepEqual(
    IRON_ARMOUR.map(({ item, location }) => `${item} ${location}`),
    ['helmet head', 'chestplate chest', 'leggings legs', 'boots feet'].map((s) => {
      const [piece, slot] = s.split(' ');
      return `minecraft:iron_${piece} slot.armor.${slot}`;
    })
  );
});

test('the scan filter is built blocks, ore and containers once each', () => {
  const expected = new Set([...BLOCK_ITEMS.keys(), ...IRON_ORE, ...CONTAINER_BLOCKS]);
  assert.equal(SCAN_TYPES.length, new Set(SCAN_TYPES).size, 'a scan type is listed twice');
  assert.deepEqual(sorted(SCAN_TYPES), sorted(expected));
  assert.equal(SCAN_TYPES.filter((id) => id === HOPPER).length, 1);
  assert.ok(SCAN_TYPES.every((id) => BLOCKS_1_26_51.has(id)));
});

test('legendaries are not iron: no andrew: id is in any list', () => {
  for (const set of [IRON_ITEMS, new Set(BLOCK_ITEMS.keys()), IRON_ORE, CONTAINER_BLOCKS, IRON_ENTITY_TYPES]) {
    assert.deepEqual([...set].filter((id) => !id.startsWith('minecraft:')), []);
  }
});
