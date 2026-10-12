// The enchantments a legendary never keeps, with no engine import: the C-37 scrubs (enchant.ts, src/sculk/enchant.ts)
// strip them, and the enchanting roller (src/enchanting/roll-rules.ts) never offers them (L0-ench-r003).

import { SCULK_CROSSBOW, TRIDENT } from "./registry";

/** Weapon item id → the enchantments it never keeps. Every other enchantment the item admits stays. */
export const FORBIDDEN_ENCHANTMENTS: ReadonlyMap<string, readonly string[]> = new Map([[TRIDENT.itemId, ["loyalty", "riptide"]]]);

/** The Sculk Crossbow never keeps it (spec §8, T15; L0-sclk-r005); its own strip takes it off. */
export const PIERCING = "piercing";

/** Every enchantment `itemId` never keeps, from both strips; empty for any other item. */
export function forbiddenFor(itemId: string): readonly string[] {
  const listed = FORBIDDEN_ENCHANTMENTS.get(itemId) ?? [];
  return itemId === SCULK_CROSSBOW.itemId ? [...listed, PIERCING] : listed;
}
