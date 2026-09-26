// The custom chest table of the Windmill and the Airship (spec §3.1–§3.3,
// L0-loot-p001): 13 weighted categories, 5–12 attempts per chest, one
// cumulative-weight draw per attempt (L0-loot-adr1). Pure data and math — no
// engine import — so node tests roll the same code the chest fill runs.

/** Seeded or not, a source of uniform floats in [0, 1). */
export type Rng = () => number;

export const ATTEMPTS_MIN = 5;
export const ATTEMPTS_MAX = 12;
export const DIAMOND_SHARE = 0.2;
/** Enchantments per enchanted item, inclusive; capped by what the item can carry. */
export const ENCHANTS_MIN = 1;
export const ENCHANTS_MAX = 3;

export type Tool = "sword" | "axe";
export type ArmorSlot = "helmet" | "chestplate" | "leggings" | "boots";
export type Gear = Tool | ArmorSlot;

export interface Category {
  id: string;
  weight: number;
  /** Inclusive stack size; gear is always 1. */
  qty: readonly [number, number];
  /** Item ids the category picks from uniformly; gear rolls material and slot instead. */
  items?: readonly string[];
  gear?: "armor" | Tool;
  enchanted?: boolean;
  /** At most one success per chest; later draws exclude the category (L0-loot-asm1, option a). */
  once?: boolean;
}

const LOGS = [
  "minecraft:oak_log",
  "minecraft:spruce_log",
  "minecraft:birch_log",
  "minecraft:jungle_log",
  "minecraft:acacia_log",
  "minecraft:dark_oak_log",
  "minecraft:mangrove_log",
  "minecraft:cherry_log",
  "minecraft:pale_oak_log",
];

/** Spec §3.2. Weights are relative and deliberately do not sum to 100. */
export const CATEGORIES: readonly Category[] = [
  { id: "sticks", weight: 45, qty: [2, 8], items: ["minecraft:stick"] },
  { id: "logs", weight: 24, qty: [2, 6], items: LOGS },
  { id: "iron_ingot", weight: 32, qty: [2, 8], items: ["minecraft:iron_ingot"] },
  { id: "copper_ingot", weight: 30, qty: [3, 10], items: ["minecraft:copper_ingot"] },
  { id: "gold_ingot", weight: 17, qty: [1, 5], items: ["minecraft:gold_ingot"] },
  { id: "diamond", weight: 6, qty: [1, 3], items: ["minecraft:diamond"] },
  { id: "golden_apple", weight: 7, qty: [1, 3], items: ["minecraft:golden_apple"], once: true },
  { id: "armor_unenchanted", weight: 15, qty: [1, 1], gear: "armor" },
  { id: "armor_enchanted", weight: 5, qty: [1, 1], gear: "armor", enchanted: true },
  { id: "sword_unenchanted", weight: 12, qty: [1, 1], gear: "sword" },
  { id: "sword_enchanted", weight: 4, qty: [1, 1], gear: "sword", enchanted: true },
  { id: "axe_unenchanted", weight: 12, qty: [1, 1], gear: "axe" },
  { id: "axe_enchanted", weight: 4, qty: [1, 1], gear: "axe", enchanted: true },
];

export const ARMOR_SLOTS: readonly ArmorSlot[] = ["helmet", "chestplate", "leggings", "boots"];

/** Vanilla maximum levels. Curses (binding, vanishing) are absent by construction (spec §3.3). */
export const MAX_LEVEL: Readonly<Record<string, number>> = {
  protection: 4,
  fire_protection: 4,
  blast_protection: 4,
  projectile_protection: 4,
  thorns: 3,
  unbreaking: 3,
  mending: 1,
  respiration: 3,
  aqua_affinity: 1,
  feather_falling: 4,
  depth_strider: 3,
  frost_walker: 2,
  soul_speed: 3,
  swift_sneak: 3,
  sharpness: 5,
  smite: 5,
  bane_of_arthropods: 5,
  knockback: 2,
  fire_aspect: 2,
  looting: 3,
  efficiency: 5,
  fortune: 3,
  silk_touch: 1,
};

/** Mutually exclusive vanilla sets; an item takes at most one from each. */
export const EXCLUSIVE: readonly (readonly string[])[] = [
  ["protection", "fire_protection", "blast_protection", "projectile_protection"],
  ["sharpness", "smite", "bane_of_arthropods"],
  ["depth_strider", "frost_walker"],
  ["fortune", "silk_touch"],
];

const PROTECTIONS = ["protection", "fire_protection", "blast_protection", "projectile_protection", "thorns", "unbreaking", "mending"];

/** Enchantments vanilla accepts on each gear kind. */
export const ENCHANTS_FOR: Readonly<Record<Gear, readonly string[]>> = {
  helmet: [...PROTECTIONS, "respiration", "aqua_affinity"],
  chestplate: PROTECTIONS,
  leggings: [...PROTECTIONS, "swift_sneak"],
  boots: [...PROTECTIONS, "feather_falling", "depth_strider", "frost_walker", "soul_speed"],
  sword: ["sharpness", "smite", "bane_of_arthropods", "knockback", "fire_aspect", "looting", "unbreaking", "mending"],
  axe: ["sharpness", "smite", "bane_of_arthropods", "efficiency", "fortune", "silk_touch", "unbreaking", "mending"],
};

export interface EnchantRoll {
  id: string;
  level: number;
}

export interface LootStack {
  category: string;
  typeId: string;
  amount: number;
  enchants: EnchantRoll[];
}

export const intIn = (rng: Rng, min: number, max: number): number => min + Math.floor(rng() * (max - min + 1));
const pick = <T>(rng: Rng, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length)];

/** One cumulative-weight draw over `pool`: exactly one category per call. */
export function drawCategory(rng: Rng, pool: readonly Category[]): Category {
  const total = pool.reduce((s, c) => s + c.weight, 0);
  let r = rng() * total;
  for (const c of pool) {
    r -= c.weight;
    if (r < 0) return c;
  }
  return pool[pool.length - 1];
}

/** Distinct, mutually compatible enchantments at levels 1..vanilla max. */
export function rollEnchants(rng: Rng, gear: Gear): EnchantRoll[] {
  const open = [...ENCHANTS_FOR[gear]];
  const want = intIn(rng, ENCHANTS_MIN, ENCHANTS_MAX);
  const out: EnchantRoll[] = [];
  while (out.length < want && open.length > 0) {
    const id = open.splice(Math.floor(rng() * open.length), 1)[0];
    out.push({ id, level: intIn(rng, 1, MAX_LEVEL[id]) });
    const rivals = EXCLUSIVE.find((g) => g.includes(id)) ?? [];
    for (let i = open.length - 1; i >= 0; i--) if (rivals.includes(open[i])) open.splice(i, 1);
  }
  return out;
}

function resolve(rng: Rng, c: Category): LootStack {
  if (c.gear === undefined) {
    return { category: c.id, typeId: pick(rng, c.items ?? []), amount: intIn(rng, c.qty[0], c.qty[1]), enchants: [] };
  }
  const material = rng() < DIAMOND_SHARE ? "diamond" : "iron";
  const kind: Gear = c.gear === "armor" ? pick(rng, ARMOR_SLOTS) : c.gear;
  return {
    category: c.id,
    typeId: `minecraft:${material}_${kind}`,
    amount: 1,
    enchants: c.enchanted === true ? rollEnchants(rng, kind) : [],
  };
}

/** One chest: 5–12 attempts, each yielding exactly one stack. */
export function rollChest(rng: Rng, categories: readonly Category[] = CATEGORIES): LootStack[] {
  const attempts = intIn(rng, ATTEMPTS_MIN, ATTEMPTS_MAX);
  const used = new Set<string>();
  const out: LootStack[] = [];
  for (let i = 0; i < attempts; i++) {
    const c = drawCategory(
      rng,
      categories.filter((k) => k.once !== true || !used.has(k.id))
    );
    if (c.once === true) used.add(c.id);
    out.push(resolve(rng, c));
  }
  return out;
}

/**
 * Deterministic generator seeded from a string (FNV-1a into mulberry32). The
 * chest fill seeds it with the instance id and chest index, so a fill repeated
 * after a crash writes the same stacks into the same slots.
 */
export function seededRng(seed: string): Rng {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 0x01000193);
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** `count` distinct slot indices out of `size`, in roll order (vanilla-style scatter). */
export function scatterSlots(rng: Rng, size: number, count: number): number[] {
  if (count > size) throw new Error(`loot: ${count} stacks do not fit ${size} slots`);
  const slots = Array.from({ length: size }, (_, i) => i);
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(rng() * (size - i));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots.slice(0, count);
}
