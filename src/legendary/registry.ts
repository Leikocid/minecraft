// The legendary weapons this add-on ships, and the one place their persistent
// key names are derived from. Pure: `ItemStack` is imported as a type only, so
// node tests bundle this file without stubbing @minecraft/server.

import type { ItemStack } from "@minecraft/server";

export interface LegendaryDef {
  itemId: string;
  /** Namespace of the item-mark, craft-flag and pending keys — see keysFor(). */
  keyPrefix: string;
  /** Namespace of the player's cooldown and busy timers — see cooldownKey(). */
  abilityKey: string;
  /** Translation key of the item name without the `.name` suffix. */
  nameKey: string;
  cooldownTicks: number;
  craftGate: boolean;
  /**
   * What the weapon's recipe outputs instead of the weapon (AD-lgnd-08). Only a
   * token spends the world's one craft; a plain `itemId` stack never does.
   */
  craftTokenId: string;
  /** What a blocked craft hands back (Q-008). */
  refund: ReadonlyArray<readonly [string, number]>;
  /** Prefix of the weapon's own lang keys: first_craft, craft_blocked, returned, admin_given, reset. */
  textPrefix: string;
  /** Operator command: `<command> give [player]` / `<command> reset`. */
  command: string;
  /**
   * The weapon's own HUD lang keys, rendered with the shared keys' arguments
   * (L0-adr-oded §1); absent keeps `andrew.legendary.ready|cooldown`.
   * A def field rather than "own key if it exists": `translate` resolves on the
   * client, so the script cannot tell whether a key exists (C-16).
   */
  hudKeys?: { ready: string; cooldown: string };
}

export const WEB_SWORD: LegendaryDef = {
  itemId: "andrew:web_sword",
  keyPrefix: "ws",
  abilityKey: "web_sword",
  nameKey: "item.andrew:web_sword",
  cooldownTicks: 600,
  craftGate: true,
  craftTokenId: "andrew:web_sword_crafted",
  refund: [
    ["minecraft:web", 4],
    ["minecraft:diamond_sword", 1],
  ],
  textPrefix: "andrew.web_sword",
  command: "andrew:websword",
};

export const SCYTHE_OF_CALAMITY: LegendaryDef = {
  itemId: "andrew:scythe_of_calamity",
  keyPrefix: "sc",
  abilityKey: "scythe_of_calamity",
  nameKey: "item.andrew:scythe_of_calamity",
  cooldownTicks: 600,
  craftGate: true,
  craftTokenId: "andrew:scythe_of_calamity_crafted",
  refund: [
    ["minecraft:golden_apple", 2],
    ["minecraft:obsidian", 2],
    ["minecraft:diamond_hoe", 1],
  ],
  textPrefix: "andrew.scythe",
  command: "andrew:scythe",
};

export const ORBITAL_CANNON: LegendaryDef = {
  itemId: "andrew:orbital_cannon",
  keyPrefix: "oc",
  abilityKey: "orbital_cannon",
  nameKey: "item.andrew:orbital_cannon",
  cooldownTicks: 600,
  craftGate: true,
  craftTokenId: "andrew:orbital_cannon_crafted",
  refund: [
    ["minecraft:tnt", 4],
    ["minecraft:fishing_rod", 1],
  ],
  textPrefix: "andrew.orbital",
  command: "andrew:orbital",
  hudKeys: { ready: "andrew.orbital.hud_ready", cooldown: "andrew.orbital.hud_cooldown" },
};

export const DRAGON_KATANA: LegendaryDef = {
  itemId: "andrew:dragon_katana",
  keyPrefix: "dk",
  abilityKey: "dragon_katana",
  nameKey: "item.andrew:dragon_katana",
  cooldownTicks: 600,
  craftGate: true,
  craftTokenId: "andrew:dragon_katana_crafted",
  refund: [
    ["minecraft:golden_apple", 2],
    ["minecraft:ender_pearl", 2],
    ["minecraft:diamond_sword", 1],
  ],
  textPrefix: "andrew.katana",
  command: "andrew:katana",
  hudKeys: { ready: "andrew.katana.hud_ready", cooldown: "andrew.katana.hud_cooldown" },
};

export const LEGENDARIES: ReadonlyArray<LegendaryDef> = [WEB_SWORD, SCYTHE_OF_CALAMITY, ORBITAL_CANNON, DRAGON_KATANA];

export function defFor(itemId: string): LegendaryDef | undefined {
  return LEGENDARIES.find((def) => def.itemId === itemId);
}

export function defForStack(stack?: ItemStack): LegendaryDef | undefined {
  return stack === undefined ? undefined : defFor(stack.typeId);
}

/** The weapon whose craft token `stack` is, if it is one. */
export function defForToken(stack?: ItemStack): LegendaryDef | undefined {
  return stack === undefined ? undefined : LEGENDARIES.find((def) => def.craftGate && def.craftTokenId === stack.typeId);
}

const LEGENDARY_TYPE_IDS: ReadonlySet<string> = new Set(LEGENDARIES.flatMap((def) => [def.itemId, def.craftTokenId]));

/**
 * Whether `stack` is a legendary weapon or its craft token, by type alone
 * (L0-lgnd-ad13): marked, unmarked and stale copies alike, and no dynamic
 * property is read. "Is it a protected instance" is `isLegendaryItemEntity`.
 */
export function isLegendaryStack(stack?: ItemStack): boolean {
  return stack !== undefined && LEGENDARY_TYPE_IDS.has(stack.typeId);
}

export function defForAbility(abilityKey: string): LegendaryDef | undefined {
  return LEGENDARIES.find((def) => def.abilityKey === abilityKey);
}

export interface LegendaryKeys {
  /** ItemStack: craft | admin (Q-006). */
  origin: string;
  /** ItemStack: owner's player id. */
  owner: string;
  /** ItemStack: unique instance id. */
  id: string;
  /** ItemStack: crafter's name, craft origin only. */
  ownerName: string;
  /** World: the one survival craft has happened. */
  crafted: string;
  /** World: who made it. */
  craftedBy: string;
  /** Player: serialized mark owed back after death. */
  pending: string;
  /** ItemStack: instance generation (absent = 0). */
  gen: string;
  /** World: return target's id -> instances owed back after a loss. */
  owed: string;
}

/**
 * Dynamic property keys of one weapon. The Web Sword's `andrew:ws_*` keys are
 * already written into existing worlds — a changed key orphans every sword
 * crafted under the old one.
 */
export function keysFor(def: LegendaryDef): LegendaryKeys {
  const p = `andrew:${def.keyPrefix}_`;
  return {
    origin: `${p}origin`,
    owner: `${p}owner`,
    id: `${p}id`,
    ownerName: `${p}owner_name`,
    crafted: `${p}crafted`,
    craftedBy: `${p}crafted_by`,
    pending: `${p}pending`,
    gen: `${p}gen`,
    owed: `${p}owed`,
  };
}

/** World property: the live generation of instance `id` (absent = 0). */
export function genLedgerKey(def: LegendaryDef, id: string): string {
  return `andrew:${def.keyPrefix}_gen:${id}`;
}

/** Player property holding the epoch-ms deadline of the ability's cooldown. */
export function cooldownKey(abilityKey: string): string {
  return `andrew:cd_${abilityKey}`;
}

/** Player property holding the epoch-ms end of the ability's busy window. */
export function busyKey(abilityKey: string): string {
  return `andrew:busy_${abilityKey}`;
}
