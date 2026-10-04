// What the UFO magnet treats as iron (UFO §4, §5; L0-magn-eirn), as BDS
// 1.26.51.1 names it. Pure, so node tests load it without @minecraft/server.

import type { ItemStack } from "@minecraft/server";

const mc = (ids: readonly string[]): string[] => ids.map((id) => `minecraft:${id}`);

export const RAILS: readonly string[] = mc(["rail", "golden_rail", "detector_rail", "activator_rail"]);
export const MINECARTS: readonly string[] = mc(["minecart", "chest_minecart", "hopper_minecart", "tnt_minecart", "command_block_minecart"]);
export const HOPPER = "minecraft:hopper";
export const IRON_DOOR = "minecraft:iron_door";
export const RAW_IRON = "minecraft:raw_iron";
export const IRON_GOLEM = "minecraft:iron_golem";

/** Ground items, container stacks and what a player holds (§4 items). */
export const IRON_ITEMS: ReadonlySet<string> = new Set(
  mc([
    "iron_ingot",
    "iron_nugget",
    "raw_iron",
    "iron_block",
    "raw_iron_block",
    "iron_ore",
    "deepslate_iron_ore",
    "iron_sword",
    "iron_pickaxe",
    "iron_axe",
    "iron_shovel",
    "iron_hoe",
    // §4 "all iron weapons" and "all iron armour" on 1.26.51 include these two.
    "iron_spear",
    "iron_helmet",
    "iron_chestplate",
    "iron_leggings",
    "iron_boots",
    "iron_horse_armor",
    "iron_nautilus_armor",
    "bucket",
    "water_bucket",
    "lava_bucket",
    "milk_bucket",
    "powder_snow_bucket",
    "cod_bucket",
    "salmon_bucket",
    "tropical_fish_bucket",
    "pufferfish_bucket",
    "axolotl_bucket",
    "tadpole_bucket",
    "sulfur_cube_bucket",
    "shears",
    "flint_and_steel",
    "compass",
    // The same compass bound to a lodestone; recovery_compass is another item.
    "lodestone_compass",
    "shield",
    "crossbow",
    "iron_door",
    "iron_trapdoor",
    "iron_bars",
    "anvil",
    "chipped_anvil",
    "damaged_anvil",
    "cauldron",
    "hopper",
    "heavy_weighted_pressure_plate",
    // §4 "chain"; minecraft:chain is gone on 1.26.51 and copper chains are not iron.
    "iron_chain",
    "lantern",
    "soul_lantern",
  ]).concat(MINECARTS, RAILS)
);

/**
 * Built blocks (class 4) and the item each becomes. The hopper is here only for
 * when it is empty: one with anything in it is a container (§5, L0-lgnd-cx13).
 */
export const BLOCK_ITEMS: ReadonlyMap<string, string> = new Map<string, string>([
  ...mc(["iron_block", "raw_iron_block", "iron_bars", "iron_door", "iron_trapdoor", "anvil", "chipped_anvil", "damaged_anvil"]).map((id): [string, string] => [id, id]),
  // No item of its own on 1.26.51: it is the most worn anvil left in old worlds.
  ["minecraft:deprecated_anvil", "minecraft:damaged_anvil"],
  ...mc(["cauldron", "hopper", "heavy_weighted_pressure_plate", "iron_chain", "lantern", "soul_lantern"]).map((id): [string, string] => [id, id]),
  ...RAILS.map((id): [string, string] => [id, id]),
]);

/** Class 5; each gives one raw_iron, like a mined ore without Fortune (§5). */
export const IRON_ORE: ReadonlySet<string> = new Set(mc(["iron_ore", "deepslate_iron_ore"]));

const SHULKER_COLOURS = ["white", "orange", "magenta", "light_blue", "yellow", "lime", "pink", "gray", "light_gray", "cyan", "purple", "blue", "brown", "green", "red", "black"];
/** §5 "chests" covers them; ender chests are per player and not in the list. */
const COPPER_CHESTS = ["copper", "exposed_copper", "weathered_copper", "oxidized_copper"].flatMap((c) => [`${c}_chest`, `waxed_${c}_chest`]);

/** Class 2 sources: iron stacks come out, the block stays. The crafter has no inventory in the API (U5). */
export const CONTAINER_BLOCKS: ReadonlySet<string> = new Set(
  mc([
    "chest",
    "trapped_chest",
    ...COPPER_CHESTS,
    "barrel",
    "hopper",
    // A burning furnace, blast furnace or smoker is a lit_* block.
    "furnace",
    "lit_furnace",
    "blast_furnace",
    "lit_blast_furnace",
    "smoker",
    "lit_smoker",
    "dispenser",
    "dropper",
    "brewing_stand",
    "undyed_shulker_box",
    ...SHULKER_COLOURS.map((c) => `${c}_shulker_box`),
  ])
);

/** Chests pair into one 54-slot container that either half exposes (U5). */
export const PAIRED_CHESTS: ReadonlySet<string> = new Set(mc(["chest", "trapped_chest", ...COPPER_CHESTS]));

/** Class 3 by type; mobs and armour stands join through IRON_ARMOUR. */
export const IRON_ENTITY_TYPES: ReadonlySet<string> = new Set([IRON_GOLEM, ...MINECARTS]);

/**
 * §4 armour slots, read with hasitem one item at a time: a list in hasitem
 * means all of them (U4b). The body slot (horse and nautilus armour) and the
 * hands do not count (L0-magn-asbd).
 */
export const IRON_ARMOUR: ReadonlyArray<{ readonly item: string; readonly location: string }> = [
  { item: "minecraft:iron_helmet", location: "slot.armor.head" },
  { item: "minecraft:iron_chestplate", location: "slot.armor.chest" },
  { item: "minecraft:iron_leggings", location: "slot.armor.legs" },
  { item: "minecraft:iron_boots", location: "slot.armor.feet" },
];

/** The one getBlocks filter of the magnet-on scan. */
export const SCAN_TYPES: readonly string[] = [...new Set([...BLOCK_ITEMS.keys(), ...IRON_ORE, ...CONTAINER_BLOCKS])];

export const isIronItem = (typeId: string): boolean => IRON_ITEMS.has(typeId);

/** What the magnet moves as an item: iron, or a legendary weapon. A craft token is neither. */
export const isMagneticStack = (stack: ItemStack, isLegendaryWeapon: (s: ItemStack) => boolean): boolean =>
  isIronItem(stack.typeId) || isLegendaryWeapon(stack);
export const isIronEntityType = (typeId: string): boolean => IRON_ENTITY_TYPES.has(typeId);

export type BlockRole = "container" | "built" | "ore";

/** `hopperEmpty` is asked only for a hopper; for anything else it is never called. */
export function blockRole(typeId: string, hopperEmpty: () => boolean): BlockRole | undefined {
  if (typeId === HOPPER) return hopperEmpty() ? "built" : "container";
  if (CONTAINER_BLOCKS.has(typeId)) return "container";
  if (BLOCK_ITEMS.has(typeId)) return "built";
  if (IRON_ORE.has(typeId)) return "ore";
  return undefined;
}

/** The single item a pulled block or ore becomes (§5, L0-magn-pext). */
export function itemForBlock(typeId: string): string | undefined {
  return IRON_ORE.has(typeId) ? RAW_IRON : BLOCK_ITEMS.get(typeId);
}
