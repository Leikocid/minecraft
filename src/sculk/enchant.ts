// Piercing never stays on a Sculk Crossbow (spec §8, T15; L0-sclk-r005, ad01, adr-scpi). Slot `crossbow` admits it,
// and stable 2.10.0 has no before-event for an anvil or an enchanting table (CNTR-SCLK-CX01), so the crossbow loses it
// in the tick it reaches a player's inventory, or when the player changes the hotbar slot. Deviation: README.md (C-16).

import { EntityComponentTypes, EquipmentSlot, type ItemStack, type Player, system, world } from "@minecraft/server";
import { SCULK_CROSSBOW } from "../legendary/registry";

export const PIERCING = "piercing";

/** `inventory`: playerInventoryItemChange named the slot; `hand`: the hotbar selection changed. */
export type StripTrigger = "inventory" | "hand";

export interface StripReport {
  playerId: string;
  playerName: string;
  /** The container slot, or the off hand. */
  where: number | "offhand";
  trigger: StripTrigger;
  /** The Piercing level taken off. */
  level: number;
  /** What the stack still carries, `id` + level, sorted. */
  kept: string[];
  tick: number;
}

export type StripObserver = (report: StripReport) => void;

const observers: StripObserver[] = [];
let armed = false;

const log = (msg: string): void => console.warn(`[andrew] sculk: ${msg}`);

export function observeStrips(observer: StripObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

/**
 * Takes Piercing off `stack` in place and returns the level it had; 0 when the stack is not a Sculk Crossbow or has no
 * Piercing. A stack read from a slot is a copy, so the caller writes it back.
 */
export function stripPiercing(stack: ItemStack | undefined): number {
  if (stack?.typeId !== SCULK_CROSSBOW.itemId) return 0;
  const enchantable = stack.getComponent("minecraft:enchantable");
  const level = enchantable?.getEnchantment(PIERCING)?.level ?? 0;
  if (enchantable === undefined || level === 0) return 0;
  enchantable.removeEnchantment(PIERCING);
  return level;
}

export function enchantmentsOf(stack: ItemStack | undefined): string[] {
  const list = stack?.getComponent("minecraft:enchantable")?.getEnchantments() ?? [];
  return list.map((e) => `${e.type.id}${e.level}`).sort();
}

function report(player: Player, where: number | "offhand", trigger: StripTrigger, level: number, stack: ItemStack): void {
  const r: StripReport = {
    playerId: player.id,
    playerName: player.name,
    where,
    trigger,
    level,
    kept: enchantmentsOf(stack),
    tick: system.currentTick,
  };
  log(`stripped piercing ${level} from ${player.name} (${where === "offhand" ? "off hand" : `slot ${where}`}, ${trigger}); kept ${r.kept.join("+") || "nothing"}`);
  for (const observer of [...observers]) {
    try {
      observer(r);
    } catch (err) {
      log(`strip observer threw ${String(err)}`);
    }
  }
}

function stripSlot(player: Player, slot: number, trigger: StripTrigger): void {
  const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (container === undefined || slot < 0 || slot >= container.size) return;
  const stack = container.getItem(slot);
  const level = stripPiercing(stack);
  if (stack === undefined || level === 0) return;
  // Raises playerInventoryItemChange again, for a stack that now has nothing to strip.
  container.setItem(slot, stack);
  report(player, slot, trigger, level, stack);
}

/** No inventory event names the off hand, so it is checked on the hand trigger only. */
function stripOffhand(player: Player, trigger: StripTrigger): void {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const stack = equippable?.getEquipment(EquipmentSlot.Offhand);
  const level = stripPiercing(stack);
  if (equippable === undefined || stack === undefined || level === 0) return;
  // Returns false, not throws, for an item without minecraft:allow_off_hand.
  if (!equippable.setEquipment(EquipmentSlot.Offhand, stack)) {
    log(`the off hand of ${player.name} refused the crossbow without piercing; it keeps piercing ${level}`);
    return;
  }
  report(player, "offhand", trigger, level, stack);
}

function guarded(player: Player | undefined, what: string, strip: (player: Player) => void): void {
  // Undefined for a SimulatedPlayer in the release pack; the GameTest pack arms its own copy (src/gametest/main.ts).
  if (player === undefined || !player.isValid) return;
  try {
    strip(player);
  } catch (err) {
    log(`piercing strip on ${what} for ${player.name} threw ${String(err)}`);
  }
}

export function registerEnchant(): void {
  if (armed) return;
  armed = true;
  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    if (event.itemStack?.typeId !== SCULK_CROSSBOW.itemId) return;
    guarded(event.player, `slot ${event.slot}`, (player) => stripSlot(player, event.slot, "inventory"));
  });
  world.afterEvents.playerHotbarSelectedSlotChange.subscribe((event) => {
    guarded(event.player, "a hand change", (player) => {
      stripSlot(player, event.newSlotSelected, "hand");
      stripOffhand(player, "hand");
    });
  });
}
