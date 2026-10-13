// The Pearl Rod as an item (spec v3 §6; L0-pear-pr01, L0-pear-ru04): the craft token is swapped for a marked
// vanilla fishing rod, and a marked rod's durability damage is written back to 0. The decisions are in
// item-rules.ts; this module is the engine half — events in, container writes out.

import { type Container, ItemStack, type Player, system, world } from "@minecraft/server";
import {
  HAND_CHECK_TICKS,
  MARK_KEY,
  REPAIR_AFTER_USE_TICKS,
  ROD_ID,
  ROD_NAME,
  type StackView,
  TOKEN_ID,
  itemAction,
  isPearlRod,
  newRodId,
  rodsFor,
  unboundLore,
} from "./item-rules";

/** Counters a GameTest reads to tell which path zeroed a rod. */
export const itemStats = { swaps: 0, repairsInEvent: 0, repairsAfterUse: 0, repairsOnHandCheck: 0 };

export function viewOf(stack: ItemStack | undefined): StackView | undefined {
  if (stack === undefined) return undefined;
  // getDynamicProperty throws on a stackable item; a fishing rod and the token both stack to 1.
  const mark = stack.maxAmount === 1 ? stack.getDynamicProperty(MARK_KEY) : undefined;
  return { typeId: stack.typeId, mark, damage: stack.getComponent("minecraft:durability")?.damage };
}

export function isPearlRodStack(stack: ItemStack | undefined): boolean {
  const view = viewOf(stack);
  return view !== undefined && isPearlRod(view);
}

/** A fresh Pearl Rod: a new vanilla rod, so no enchantment of the rod that went into the craft survives. */
export function makePearlRod(): ItemStack {
  const rod = new ItemStack(ROD_ID, 1);
  rod.nameTag = ROD_NAME;
  rod.setLore(unboundLore());
  rod.setDynamicProperty(MARK_KEY, newRodId(world.getAbsoluteTime(), Math.random));
  return rod;
}

const inventoryOf = (player: Player): Container | undefined => player.getComponent("minecraft:inventory")?.container;

/** Zeroes the damage of a Pearl Rod in `slot`; false when there is no worn Pearl Rod there. */
export function repairSlot(player: Player, slot: number): boolean {
  const container = inventoryOf(player);
  const stack = container?.getItem(slot);
  if (container === undefined || stack === undefined || itemAction(viewOf(stack)) !== "repair") return false;
  const durability = stack.getComponent("minecraft:durability");
  if (durability === undefined) return false;
  durability.damage = 0;
  // setItem while the hook is out keeps the hook and the next use reels it (probe Q7).
  container.setItem(slot, stack);
  return true;
}

/** Players with a token reported this tick; the inventory is read once per player, not once per event. */
const queued = new Map<string, Player>();
let flushScheduled = false;

export function registerPearlItem(): void {
  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    if (event.itemStack?.typeId !== TOKEN_ID) return;
    // Typed non-nullable; undefined for a SimulatedPlayer in a pack without @minecraft/server-gametest, which
    // is why the GameTest pack arms its own copy of this module.
    const holder: Player | undefined = event.player;
    if (holder === undefined) return;
    queued.set(holder.id, holder);
    if (flushScheduled) return;
    flushScheduled = true;
    system.run(flush);
  });

  world.afterEvents.itemUse.subscribe((event) => {
    const player: Player | undefined = event.source;
    if (player === undefined || !isPearlRodStack(event.itemStack)) return;
    const slot = player.selectedSlotIndex;
    // A reel's damage is already on the rod when this event arrives (pear_item_hundred_casts), so it is written
    // back in the same tick; the later check catches damage the engine applies after the event.
    if (repairSlot(player, slot)) itemStats.repairsInEvent++;
    system.runTimeout(() => {
      if (player.isValid && repairSlot(player, slot)) itemStats.repairsAfterUse++;
    }, REPAIR_AFTER_USE_TICKS);
  });

  system.runInterval(handCheck, HAND_CHECK_TICKS);
  console.warn("[andrew] pearl rod item armed");
}

function flush(): void {
  flushScheduled = false;
  const players = [...queued.values()];
  queued.clear();
  for (const player of players) {
    if (!player.isValid) continue;
    try {
      swapTokens(player);
    } catch (err) {
      const why = err instanceof Error ? err.message : String(err);
      console.warn(`[andrew] pearl rod: the token swap failed for ${player.name}: ${why}`);
    }
  }
}

/** Every token in the inventory becomes a Pearl Rod in the same slot; a stack of n gives n rods. */
function swapTokens(player: Player): void {
  const container = inventoryOf(player);
  if (container === undefined) return;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack === undefined || itemAction(viewOf(stack)) !== "swap") continue;
    container.setItem(slot, makePearlRod());
    itemStats.swaps++;
    for (let extra = 1; extra < rodsFor(stack.amount); extra++) {
      const leftover = container.addItem(makePearlRod());
      if (leftover !== undefined) player.dimension.spawnItem(leftover, player.location);
      itemStats.swaps++;
    }
  }
}

/** The rod a player is holding; one getItem per player per check, and a write only when it is worn. */
function handCheck(): void {
  for (const player of world.getAllPlayers()) {
    // An undefined entry is a SimulatedPlayer seen from a pack without the gametest module.
    if (player?.isValid !== true) continue;
    try {
      if (repairSlot(player, player.selectedSlotIndex)) itemStats.repairsOnHandCheck++;
    } catch (err) {
      const why = err instanceof Error ? err.message : String(err);
      console.warn(`[andrew] pearl rod: the hand check failed for ${player.name}: ${why}`);
    }
  }
}
