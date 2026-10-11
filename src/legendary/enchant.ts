// Enchantments a legendary never keeps, because the weapon already does what they do (R-trdt-003: Loyalty and Riptide
// on the Above-Water Trident). Stable 2.10.0 has no before-event for an anvil or an enchanting table, so the stack
// loses them in the tick it reaches a player's inventory, or when the player changes the hotbar slot — the Sculk
// Crossbow's Piercing strip (src/sculk/enchant.ts), driven by a table. Deviation: README.md (C-16).

import { EntityComponentTypes, EquipmentSlot, type ItemStack, type Player, system, world } from "@minecraft/server";
import { TRIDENT } from "./registry";

/** Weapon item id → the enchantments it never keeps. Every other enchantment the item admits stays. */
export const FORBIDDEN_ENCHANTMENTS: ReadonlyMap<string, readonly string[]> = new Map([[TRIDENT.itemId, ["loyalty", "riptide"]]]);

/** `inventory`: playerInventoryItemChange named the slot; `hand`: the hotbar selection changed. */
export type ScrubTrigger = "inventory" | "hand";

export interface ScrubReport {
  playerId: string;
  playerName: string;
  itemId: string;
  /** The container slot, or the off hand. */
  where: number | "offhand";
  trigger: ScrubTrigger;
  /** What was taken off, `id` + level, sorted. */
  removed: string[];
  /** What the stack still carries, `id` + level, sorted. */
  kept: string[];
  tick: number;
}

export type ScrubObserver = (report: ScrubReport) => void;

const observers: ScrubObserver[] = [];
let armed = false;

const log = (msg: string): void => console.warn(`[andrew] legendary enchant: ${msg}`);

export function observeScrubs(observer: ScrubObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

export function enchantmentsOf(stack: ItemStack | undefined): string[] {
  const list = stack?.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
  return list.map((e) => `${e.type.id}${e.level}`).sort();
}

/**
 * Takes the forbidden enchantments off `stack` in place and returns them, `id` + level, sorted; empty when the stack
 * is not a weapon with a forbidden list or carries none of it. A stack read from a slot is a copy, so the caller
 * writes it back.
 */
export function scrubStack(stack: ItemStack | undefined): string[] {
  const forbidden = stack === undefined ? undefined : FORBIDDEN_ENCHANTMENTS.get(stack.typeId);
  const enchantable = forbidden === undefined ? undefined : stack?.getComponent("minecraft:enchantable");
  if (forbidden === undefined || enchantable === undefined) return [];
  const removed: string[] = [];
  for (const id of forbidden) {
    const level = enchantable.getEnchantment(id)?.level ?? 0;
    if (level === 0) continue;
    enchantable.removeEnchantment(id);
    removed.push(`${id}${level}`);
  }
  return removed.sort();
}

function report(player: Player, where: number | "offhand", trigger: ScrubTrigger, removed: string[], stack: ItemStack): void {
  const r: ScrubReport = {
    playerId: player.id,
    playerName: player.name,
    itemId: stack.typeId,
    where,
    trigger,
    removed,
    kept: enchantmentsOf(stack),
    tick: system.currentTick,
  };
  log(
    `took ${removed.join("+")} off ${stack.typeId} of ${player.name} (${where === "offhand" ? "off hand" : `slot ${where}`}, ${trigger}); ` +
      `kept ${r.kept.join("+") || "nothing"}`
  );
  for (const observer of [...observers]) {
    try {
      observer(r);
    } catch (err) {
      log(`scrub observer threw ${String(err)}`);
    }
  }
}

function scrubSlot(player: Player, slot: number, trigger: ScrubTrigger): void {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (container === undefined || slot < 0 || slot >= container.size) return;
  const stack = container.getItem(slot);
  const removed = scrubStack(stack);
  if (stack === undefined || removed.length === 0) return;
  // Raises playerInventoryItemChange again, for a stack that now has nothing to scrub.
  container.setItem(slot, stack);
  report(player, slot, trigger, removed, stack);
}

/** No inventory event names the off hand, so it is checked on the hand trigger only. */
function scrubOffhand(player: Player, trigger: ScrubTrigger): void {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const stack = equippable?.getEquipment(EquipmentSlot.Offhand);
  const removed = scrubStack(stack);
  if (equippable === undefined || stack === undefined || removed.length === 0) return;
  // Returns false, not throws, for an item without minecraft:allow_off_hand.
  if (!equippable.setEquipment(EquipmentSlot.Offhand, stack)) {
    log(`the off hand of ${player.name} refused ${stack.typeId} without ${removed.join("+")}; it keeps them`);
    return;
  }
  report(player, "offhand", trigger, removed, stack);
}

function guarded(player: Player | undefined, what: string, scrub: (player: Player) => void): void {
  // Undefined for a SimulatedPlayer in the release pack; the GameTest pack arms its own copy (src/gametest/main.ts).
  if (player === undefined || !player.isValid) return;
  try {
    scrub(player);
  } catch (err) {
    log(`scrub on ${what} for ${player.name} threw ${String(err)}`);
  }
}

export function registerEnchantScrub(): void {
  if (armed) return;
  armed = true;
  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const typeId = event.itemStack?.typeId;
    if (typeId === undefined || !FORBIDDEN_ENCHANTMENTS.has(typeId)) return;
    guarded(event.player, `slot ${event.slot}`, (player) => scrubSlot(player, event.slot, "inventory"));
  });
  world.afterEvents.playerHotbarSelectedSlotChange.subscribe((event) => {
    guarded(event.player, "a hand change", (player) => {
      scrubSlot(player, event.newSlotSelected, "hand");
      scrubOffhand(player, "hand");
    });
  });
  console.warn(`[andrew] legendary enchant scrub armed (${[...FORBIDDEN_ENCHANTMENTS].map(([id, list]) => `${id}: ${list.join(", ")}`).join("; ")})`);
}
