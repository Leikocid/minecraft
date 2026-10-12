// What spec §4 lets the enchanting table offer, as data, with no engine import (L0-ench-adr1, r001–r005, asm1,
// xasm39). tests/enchanting-eligibility.test.mjs holds every table here to the engine's, measured on BDS in
// eligibility.ts: items, enchantments, max levels, conflicts and treasure (L0-ench-gl01).

import { forbiddenFor } from "../legendary/enchant-rules";

/** The table tier, from the 1/2/3-level cost of the chosen offer (L0-xasm39). */
export type Tier = 1 | 2 | 3;

/** Bedrock 1.26.51 maximum level of every enchantment, by its id without the `minecraft:` prefix. */
export const MAX_LEVEL: ReadonlyMap<string, number> = new Map([
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

/** Never offered, whatever the item (§4). */
export const CURSES: ReadonlySet<string> = new Set(["binding", "vanishing"]);

/**
 * Formerly table-inaccessible: valid for a slot, never offered by the vanilla table. Spear Lunge stays out while the
 * probe finds it already offered (L0-ench-asm1 §5).
 */
export const TREASURE: ReadonlySet<string> = new Set(["mending", "frost_walker", "soul_speed", "swift_sneak", "wind_burst"]);

/** No result holds two members of one group (L0-ench-r002). Riptide excludes Loyalty and Channeling, which combine. */
export const CONFLICT_GROUPS: readonly (readonly string[])[] = [
  ["protection", "fire_protection", "blast_protection", "projectile_protection"],
  ["sharpness", "smite", "bane_of_arthropods"],
  ["density", "breach", "smite", "bane_of_arthropods"],
  ["silk_touch", "fortune"],
  ["depth_strider", "frost_walker"],
  ["infinity", "mending"],
  ["multishot", "piercing"],
  ["riptide", "loyalty"],
  ["riptide", "channeling"],
];

/** Wind Burst and Unbreaking take their level from three independent draws (L0-ench-r005). */
export const LEVEL_RULE_IDS: ReadonlySet<string> = new Set(["wind_burst", "unbreaking"]);
/** §4: level I, II and III each pass on their own draw with these chances; they are not shares of 100 %. */
export const LEVEL_CHANCES: readonly [number, number, number] = [0.7, 0.4, 0.2];
/** §4: the chance that a generation includes at least one eligible treasure enchantment. */
export const RARE_CHANCE = 0.2;
/** Each extra enchantment past the first is added with this chance × tier, stopping at the first failure (asm1 §1). */
export const EXTRA_CHANCE_PER_TIER = 0.1;
export const MAX_EXTRAS = 2;

export type GearClass =
  | "helmet"
  | "chestplate"
  | "leggings"
  | "boots"
  | "sword"
  | "axe"
  | "pickaxe"
  | "shovel"
  | "hoe"
  | "bow"
  | "crossbow"
  | "trident"
  | "spear"
  | "mace"
  | "fishing_rod"
  | "on_a_stick";

const DURABLE = ["unbreaking", "mending", "vanishing"];
const ARMOR = ["protection", "fire_protection", "blast_protection", "projectile_protection", "thorns", "binding", ...DURABLE];
const DIGGER = ["efficiency", "silk_touch", "fortune", ...DURABLE];
const DAMAGE = ["sharpness", "smite", "bane_of_arthropods"];
const MELEE = [...DAMAGE, "knockback", "fire_aspect", "looting", ...DURABLE];

/** Every enchantment an item of the class accepts, curses and treasure included (L0-ench-r001). */
export const CLASS_ENCHANTMENTS: ReadonlyMap<GearClass, readonly string[]> = new Map<GearClass, readonly string[]>([
  ["helmet", [...ARMOR, "respiration", "aqua_affinity"]],
  ["chestplate", ARMOR],
  ["leggings", [...ARMOR, "swift_sneak"]],
  ["boots", [...ARMOR, "feather_falling", "depth_strider", "frost_walker", "soul_speed"]],
  ["sword", MELEE],
  ["axe", [...DIGGER, ...DAMAGE]],
  ["pickaxe", DIGGER],
  ["shovel", DIGGER],
  ["hoe", DIGGER],
  ["bow", ["power", "punch", "flame", "infinity", ...DURABLE]],
  ["crossbow", ["multishot", "piercing", "quick_charge", ...DURABLE]],
  ["trident", ["impaling", "loyalty", "riptide", "channeling", ...DURABLE]],
  ["spear", ["lunge", ...MELEE]],
  ["mace", ["density", "breach", "wind_burst", "smite", "bane_of_arthropods", "fire_aspect", ...DURABLE]],
  ["fishing_rod", ["luck_of_the_sea", "lure", ...DURABLE]],
  ["on_a_stick", DURABLE],
]);

/** An add-on item's `minecraft:enchantable` slot → its class. Slot `spear` is the trident's, `melee_spear` the spear's. */
export const SLOT_CLASS: ReadonlyMap<string, GearClass> = new Map<string, GearClass>([
  ["armor_head", "helmet"],
  ["armor_torso", "chestplate"],
  ["armor_legs", "leggings"],
  ["armor_feet", "boots"],
  ["sword", "sword"],
  ["axe", "axe"],
  ["pickaxe", "pickaxe"],
  ["shovel", "shovel"],
  ["hoe", "hoe"],
  ["bow", "bow"],
  ["crossbow", "crossbow"],
  ["spear", "trident"],
  ["melee_spear", "spear"],
  ["fishing_rod", "fishing_rod"],
]);

/**
 * The `minecraft:enchantable` slot of each add-on item the table may enchant; tests/enchanting-roll.test.mjs holds
 * every item JSON in packs/behavior/items to it. The Underwater Bow is def #8 with slot `bow` (L0-ench seams).
 */
export const ADDON_SLOTS: ReadonlyMap<string, string> = new Map([
  ["andrew:web_sword", "sword"],
  ["andrew:scythe_of_calamity", "sword"],
  ["andrew:dragon_katana", "sword"],
  ["andrew:storm_blade", "sword"],
  ["andrew:miners_pickaxe", "pickaxe"],
  ["andrew:sculk_crossbow", "crossbow"],
  ["andrew:above_water_trident", "spear"],
  ["andrew:underwater_bow", "bow"],
]);

const TOOL_TIERS = ["wooden", "stone", "copper", "iron", "golden", "diamond", "netherite"];
const ARMOR_TIERS = ["leather", "chainmail", "copper", "iron", "golden", "diamond", "netherite"];

function vanillaItems(): [string, GearClass][] {
  const items: [string, GearClass][] = [];
  for (const tier of TOOL_TIERS) {
    for (const kind of ["sword", "axe", "pickaxe", "shovel", "hoe", "spear"] as const) items.push([`minecraft:${tier}_${kind}`, kind]);
  }
  for (const tier of ARMOR_TIERS) {
    for (const kind of ["helmet", "chestplate", "leggings", "boots"] as const) items.push([`minecraft:${tier}_${kind}`, kind]);
  }
  items.push(["minecraft:turtle_helmet", "helmet"]);
  for (const kind of ["bow", "crossbow", "trident", "mace", "fishing_rod"] as const) items.push([`minecraft:${kind}`, kind]);
  // The engine's table generator enchants both sticks (Unbreaking); shears, elytra and shield it never does.
  items.push(["minecraft:carrot_on_a_stick", "on_a_stick"], ["minecraft:warped_fungus_on_a_stick", "on_a_stick"]);
  return items;
}

function addonItems(): [string, GearClass][] {
  return [...ADDON_SLOTS].map(([itemId, slot]) => {
    const gear = SLOT_CLASS.get(slot);
    if (gear === undefined) throw new Error(`${itemId}: enchantable slot ${slot} has no gear class`);
    return [itemId, gear];
  });
}

/** Item id → every enchantment the item accepts, before curses and its def's forbidden list come off. */
export const ELIGIBILITY: ReadonlyMap<string, readonly string[]> = new Map(
  [...vanillaItems(), ...addonItems()].map(([itemId, gear]) => [itemId, CLASS_ENCHANTMENTS.get(gear) ?? []])
);

/**
 * What the table may offer for `itemId`: its accepted set without curses and without what its def forbids, read live
 * through forbiddenFor(). Empty for an item the table does not enchant.
 */
export function eligibleFor(itemId: string): string[] {
  const forbidden = forbiddenFor(itemId);
  return (ELIGIBILITY.get(itemId) ?? []).filter((id) => !CURSES.has(id) && !forbidden.includes(id));
}

export function conflicts(a: string, b: string): boolean {
  return a !== b && CONFLICT_GROUPS.some((group) => group.includes(a) && group.includes(b));
}

/** The context max (L0-xasm39): tier 1 allows I, tier 2 up to II, tier 3 the vanilla max. */
export function levelCap(id: string, tier: Tier): number {
  const max = MAX_LEVEL.get(id) ?? 0;
  return tier === 3 ? max : Math.min(max, tier);
}

/** R-ench-005 over three uniform draws: the highest rung that passed, I when none did, then the context max. */
export function specialLevel(draws: readonly [number, number, number], cap: number): number {
  let level = 1;
  draws.forEach((u, i) => {
    if (u < LEVEL_CHANCES[i]) level = i + 1;
  });
  return Math.min(level, cap);
}
