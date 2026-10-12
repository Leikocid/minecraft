// The engine's own answer to "which enchantment does this item take, up to which level, and beside what" (spec v3 §4,
// L0-ench-r001, r002, ac06), measured on BDS by andrew:ench_data_parity (src/gametest/ench-data.ts) and pasted from its
// `[ench-data] REF` lines. That scenario fails when the live engine drifts from these tables;
// tests/enchanting-eligibility.test.mjs fails when the roller's tables (roll-rules.ts) drift from them. No engine import.

/** Item id → enchantment id (no `minecraft:` prefix) → the highest level the engine accepts on a bare stack. */
export type Accepts = ReadonlyMap<string, Readonly<Record<string, number>>>;

/** The BDS build every table below was measured on; the unit test holds it to BDS_VERSION in scripts/targets.mjs. */
export const MEASURED_ON = "1.26.51.1";

/** EnchantmentTypes.getAll(): id → maxLevel. */
export const ENGINE_MAX_LEVEL: ReadonlyMap<string, number> = new Map([
  ["aqua_affinity", 1],
  ["bane_of_arthropods", 5],
  ["binding", 1],
  ["blast_protection", 4],
  ["breach", 4],
  ["channeling", 1],
  ["density", 5],
  ["depth_strider", 3],
  ["efficiency", 5],
  ["feather_falling", 4],
  ["fire_aspect", 2],
  ["fire_protection", 4],
  ["flame", 1],
  ["fortune", 3],
  ["frost_walker", 2],
  ["impaling", 5],
  ["infinity", 1],
  ["knockback", 2],
  ["looting", 3],
  ["loyalty", 3],
  ["luck_of_the_sea", 3],
  ["lunge", 3],
  ["lure", 3],
  ["mending", 1],
  ["multishot", 1],
  ["piercing", 4],
  ["power", 5],
  ["projectile_protection", 4],
  ["protection", 4],
  ["punch", 2],
  ["quick_charge", 3],
  ["respiration", 3],
  ["riptide", 3],
  ["sharpness", 5],
  ["silk_touch", 1],
  ["smite", 5],
  ["soul_speed", 3],
  ["swift_sneak", 3],
  ["thorns", 3],
  ["unbreaking", 3],
  ["vanishing", 1],
  ["wind_burst", 3],
]);

/** canAddEnchantment on a bare stack of each item the table enchants, every type at levels 1..maxLevel+1. */
export const ENGINE_ACCEPTS: Accepts = new Map<string, Readonly<Record<string, number>>>([
  ["andrew:above_water_trident", { channeling: 1, impaling: 5, loyalty: 3, mending: 1, riptide: 3, unbreaking: 3, vanishing: 1 }],
  ["andrew:dragon_katana", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["andrew:miners_pickaxe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["andrew:sculk_crossbow", { mending: 1, multishot: 1, piercing: 4, quick_charge: 3, unbreaking: 3, vanishing: 1 }],
  ["andrew:scythe_of_calamity", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["andrew:storm_blade", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["andrew:web_sword", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:bow", { flame: 1, infinity: 1, mending: 1, power: 5, punch: 2, unbreaking: 3, vanishing: 1 }],
  ["minecraft:carrot_on_a_stick", { mending: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:chainmail_boots", { binding: 1, blast_protection: 4, depth_strider: 3, feather_falling: 4, fire_protection: 4, frost_walker: 2, mending: 1, projectile_protection: 4, protection: 4, soul_speed: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:chainmail_chestplate", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:chainmail_helmet", { aqua_affinity: 1, binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, respiration: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:chainmail_leggings", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, swift_sneak: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_axe", { bane_of_arthropods: 5, efficiency: 5, fortune: 3, mending: 1, sharpness: 5, silk_touch: 1, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_boots", { binding: 1, blast_protection: 4, depth_strider: 3, feather_falling: 4, fire_protection: 4, frost_walker: 2, mending: 1, projectile_protection: 4, protection: 4, soul_speed: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_chestplate", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_helmet", { aqua_affinity: 1, binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, respiration: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_hoe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_leggings", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, swift_sneak: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_pickaxe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_shovel", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, lunge: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:copper_sword", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:crossbow", { mending: 1, multishot: 1, piercing: 4, quick_charge: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_axe", { bane_of_arthropods: 5, efficiency: 5, fortune: 3, mending: 1, sharpness: 5, silk_touch: 1, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_boots", { binding: 1, blast_protection: 4, depth_strider: 3, feather_falling: 4, fire_protection: 4, frost_walker: 2, mending: 1, projectile_protection: 4, protection: 4, soul_speed: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_chestplate", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_helmet", { aqua_affinity: 1, binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, respiration: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_hoe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_leggings", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, swift_sneak: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_pickaxe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_shovel", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, lunge: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:diamond_sword", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:fishing_rod", { luck_of_the_sea: 3, lure: 3, mending: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_axe", { bane_of_arthropods: 5, efficiency: 5, fortune: 3, mending: 1, sharpness: 5, silk_touch: 1, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_boots", { binding: 1, blast_protection: 4, depth_strider: 3, feather_falling: 4, fire_protection: 4, frost_walker: 2, mending: 1, projectile_protection: 4, protection: 4, soul_speed: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_chestplate", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_helmet", { aqua_affinity: 1, binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, respiration: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_hoe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_leggings", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, swift_sneak: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_pickaxe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_shovel", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, lunge: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:golden_sword", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_axe", { bane_of_arthropods: 5, efficiency: 5, fortune: 3, mending: 1, sharpness: 5, silk_touch: 1, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_boots", { binding: 1, blast_protection: 4, depth_strider: 3, feather_falling: 4, fire_protection: 4, frost_walker: 2, mending: 1, projectile_protection: 4, protection: 4, soul_speed: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_chestplate", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_helmet", { aqua_affinity: 1, binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, respiration: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_hoe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_leggings", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, swift_sneak: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_pickaxe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_shovel", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, lunge: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:iron_sword", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:leather_boots", { binding: 1, blast_protection: 4, depth_strider: 3, feather_falling: 4, fire_protection: 4, frost_walker: 2, mending: 1, projectile_protection: 4, protection: 4, soul_speed: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:leather_chestplate", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:leather_helmet", { aqua_affinity: 1, binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, respiration: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:leather_leggings", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, swift_sneak: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:mace", { bane_of_arthropods: 5, breach: 4, density: 5, fire_aspect: 2, mending: 1, smite: 5, unbreaking: 3, vanishing: 1, wind_burst: 3 }],
  ["minecraft:netherite_axe", { bane_of_arthropods: 5, efficiency: 5, fortune: 3, mending: 1, sharpness: 5, silk_touch: 1, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_boots", { binding: 1, blast_protection: 4, depth_strider: 3, feather_falling: 4, fire_protection: 4, frost_walker: 2, mending: 1, projectile_protection: 4, protection: 4, soul_speed: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_chestplate", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_helmet", { aqua_affinity: 1, binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, respiration: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_hoe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_leggings", { binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, swift_sneak: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_pickaxe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_shovel", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, lunge: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:netherite_sword", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:stone_axe", { bane_of_arthropods: 5, efficiency: 5, fortune: 3, mending: 1, sharpness: 5, silk_touch: 1, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:stone_hoe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:stone_pickaxe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:stone_shovel", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:stone_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, lunge: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:stone_sword", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:trident", { channeling: 1, impaling: 5, loyalty: 3, mending: 1, riptide: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:turtle_helmet", { aqua_affinity: 1, binding: 1, blast_protection: 4, fire_protection: 4, mending: 1, projectile_protection: 4, protection: 4, respiration: 3, thorns: 3, unbreaking: 3, vanishing: 1 }],
  ["minecraft:warped_fungus_on_a_stick", { mending: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:wooden_axe", { bane_of_arthropods: 5, efficiency: 5, fortune: 3, mending: 1, sharpness: 5, silk_touch: 1, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:wooden_hoe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:wooden_pickaxe", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:wooden_shovel", { efficiency: 5, fortune: 3, mending: 1, silk_touch: 1, unbreaking: 3, vanishing: 1 }],
  ["minecraft:wooden_spear", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, lunge: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
  ["minecraft:wooden_sword", { bane_of_arthropods: 5, fire_aspect: 2, knockback: 2, looting: 3, mending: 1, sharpness: 5, smite: 5, unbreaking: 3, vanishing: 1 }],
]);

/** Pairs canAddEnchantment refuses, in either order, once the other is on the stack — on every item that accepts both. */
export const ENGINE_CONFLICTS: readonly (readonly [string, string])[] = [
  ["bane_of_arthropods", "breach"],
  ["bane_of_arthropods", "density"],
  ["bane_of_arthropods", "sharpness"],
  ["bane_of_arthropods", "smite"],
  ["blast_protection", "fire_protection"],
  ["blast_protection", "projectile_protection"],
  ["blast_protection", "protection"],
  ["breach", "density"],
  ["breach", "smite"],
  ["channeling", "riptide"],
  ["density", "smite"],
  ["depth_strider", "frost_walker"],
  ["fire_protection", "projectile_protection"],
  ["fire_protection", "protection"],
  ["fortune", "silk_touch"],
  ["infinity", "mending"],
  ["loyalty", "riptide"],
  ["multishot", "piercing"],
  ["projectile_protection", "protection"],
  ["sharpness", "smite"],
];

/** Add-on items the roller has a row for whose item type does not exist yet: nothing to measure until they ship. */
export const NOT_SHIPPED: readonly string[] = ["andrew:underwater_bow"];

/**
 * Vanilla items whose bare stack accepts an enchantment but that have no row above: books stay vanilla (L0-ench, not in
 * scope); the engine's table generator enchants none of the rest (ench_data/outside_l30, 0 of 1000 each).
 */
export const OUTSIDE_TABLE: readonly string[] = [
  "minecraft:book",
  "minecraft:brush",
  "minecraft:carved_pumpkin",
  "minecraft:compass",
  "minecraft:creeper_head",
  "minecraft:dragon_head",
  "minecraft:elytra",
  "minecraft:enchanted_book",
  "minecraft:flint_and_steel",
  "minecraft:lodestone_compass",
  "minecraft:piglin_head",
  "minecraft:player_head",
  "minecraft:recovery_compass",
  "minecraft:shears",
  "minecraft:shield",
  "minecraft:skeleton_skull",
  "minecraft:wither_skeleton_skull",
  "minecraft:zombie_head",
];

/**
 * Per item the engine's table generator was rolled on (enchant_with_levels at 30 and at 1–30, treasure off, 1000 rolls
 * each; the probe's loot tables): the accepted enchantments it never yielded. Less the curses, this is the roller's
 * TREASURE (L0-ench-gl01).
 */
export const TABLE_WITHHOLDS: ReadonlyMap<string, readonly string[]> = new Map<string, readonly string[]>([
  ["minecraft:mace", ["mending", "vanishing", "wind_burst"]],
  ["minecraft:iron_spear", ["mending", "vanishing"]],
  ["minecraft:diamond_sword", ["mending", "vanishing"]],
  ["minecraft:diamond_axe", ["mending", "vanishing"]],
  ["minecraft:diamond_pickaxe", ["mending", "vanishing"]],
  ["minecraft:diamond_helmet", ["binding", "mending", "vanishing"]],
  ["minecraft:diamond_chestplate", ["binding", "mending", "vanishing"]],
  ["minecraft:diamond_leggings", ["binding", "mending", "swift_sneak", "vanishing"]],
  ["minecraft:diamond_boots", ["binding", "frost_walker", "mending", "soul_speed", "vanishing"]],
  ["minecraft:bow", ["mending", "vanishing"]],
  ["minecraft:crossbow", ["mending", "vanishing"]],
  ["minecraft:trident", ["mending", "vanishing"]],
  ["minecraft:fishing_rod", ["mending", "vanishing"]],
  ["minecraft:carrot_on_a_stick", ["mending", "vanishing"]],
  ["minecraft:warped_fungus_on_a_stick", ["mending", "vanishing"]],
]);

/**
 * What §4 names as treasure, plus what the probe checked as such (ENCH-PROBE-01 §5). Each one is exactly one of: the
 * roller's TREASURE, a curse, or in TABLE_ALREADY_OFFERS.
 */
export const TREASURE_CANDIDATES: readonly string[] = ["binding", "frost_walker", "lunge", "mending", "soul_speed", "swift_sneak", "vanishing", "wind_burst"];

/**
 * §4 treasure the vanilla table already offers by itself, so the roller implements none of it: enchantment → the
 * item the generator yielded it on. Lunge stays as the table has it (§4).
 */
export const TABLE_ALREADY_OFFERS: ReadonlyMap<string, string> = new Map([["lunge", "minecraft:iron_spear"]]);

const levelText = (level: number | undefined): string => (level === undefined ? "none" : String(level));

/** Every way `actual` differs from `expected`, one line each, naming the item; empty when they agree. */
export function diffAccepts(actual: Accepts, expected: Accepts): string[] {
  const out: string[] = [];
  const items = [...new Set([...actual.keys(), ...expected.keys()])].sort();
  for (const item of items) {
    const a = actual.get(item);
    const e = expected.get(item);
    if (a === undefined || e === undefined) {
      out.push(`${item}: ${a === undefined ? "missing from the actual table" : "missing from the expected table"}`);
      continue;
    }
    for (const id of [...new Set([...Object.keys(a), ...Object.keys(e)])].sort()) {
      if (a[id] !== e[id]) out.push(`${item}: ${id} actual ${levelText(a[id])}, expected ${levelText(e[id])}`);
    }
  }
  return out;
}

export const pairKey = (a: string, b: string): string => [a, b].sort().join("+");

/** Pairs in one list and not the other, as `a+b`; empty when they agree. */
export function diffPairs(actual: Iterable<readonly [string, string]>, expected: Iterable<readonly [string, string]>): string[] {
  const a = new Set([...actual].map(([x, y]) => pairKey(x, y)));
  const e = new Set([...expected].map(([x, y]) => pairKey(x, y)));
  return [
    ...[...a].filter((k) => !e.has(k)).map((k) => `conflict ${k}: actual only`),
    ...[...e].filter((k) => !a.has(k)).map((k) => `conflict ${k}: expected only`),
  ].sort();
}
