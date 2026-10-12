// Flight Duration 1 for the paper + string rocket (spec v3 §3). A recipe result carries no firework data, and
// 2.10.0 has no API that writes it, but a stack the engine made with it keeps it through clone() and setItem —
// so data-less rockets in a player's inventory are rewritten from a template /replaceitem makes once.
// The paths that do not reach flight 1: docs/feedback/rocket-duration.md.

import { type Container, ItemStack, type Player, world } from "@minecraft/server";

const ROCKET = "minecraft:firework_rocket";
const HOTBAR_SIZE = 9;

let template: ItemStack | undefined;

/** A rocket with no firework data stacks with a bare `new ItemStack`; flight 1–3 and starred rockets never do. */
function isBare(stack: ItemStack | undefined): boolean {
  return stack?.typeId === ROCKET && stack.isStackableWith(new ItemStack(ROCKET));
}

/**
 * /give and /replaceitem write flight 1; recipes, loot tables and `new ItemStack` write nothing.
 * Replaces the rockets in `slot` in place and keeps a copy of what the engine put there.
 */
function makeTemplate(player: Player, container: Container, slot: number, amount: number): ItemStack | undefined {
  const target = slot < HOTBAR_SIZE ? `slot.hotbar ${slot}` : `slot.inventory ${slot - HOTBAR_SIZE}`;
  try {
    player.runCommand(`replaceitem entity @s ${target} ${ROCKET} ${amount}`);
  } catch (err) {
    console.warn(`[andrew] rocket flight: /replaceitem failed for ${player.name}: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
  const made = container.getItem(slot);
  return made?.typeId === ROCKET && !isBare(made) ? made.clone() : undefined;
}

/** Tops up flight-1 stacks other than `slot` with up to `amount` rockets; how many found no room. */
function pourIntoHeld(container: Container, flightOne: ItemStack, slot: number, amount: number): number {
  let rest = amount;
  for (let i = 0; i < container.size && rest > 0; i++) {
    const other = i === slot ? undefined : container.getItem(i);
    if (other === undefined || other.amount >= other.maxAmount || !other.isStackableWith(flightOne)) continue;
    const take = Math.min(rest, other.maxAmount - other.amount);
    other.amount += take;
    container.setItem(i, other);
    rest -= take;
  }
  return rest;
}

/**
 * Rewrites every data-less rocket stack in the inventory into flight 1. Rockets join the flight-1 stacks the player
 * already holds, as a vanilla craft would; what does not fit stays in its own slot.
 */
export function convertBareRockets(player: Player): number {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) return 0;
  let converted = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (stack === undefined || !isBare(stack)) continue;
    template ??= makeTemplate(player, container, slot, stack.amount);
    if (template === undefined) return converted;
    const rest = pourIntoHeld(container, template, slot, stack.amount);
    const fresh = rest > 0 ? template.clone() : undefined;
    if (fresh !== undefined) fresh.amount = rest;
    container.setItem(slot, fresh);
    converted += stack.amount;
  }
  return converted;
}

/** Returns the unsubscribe, so a GameTest can arm its own copy for the length of one scenario. */
export function registerRocketFlight(): () => void {
  const handler = world.afterEvents.playerInventoryItemChange.subscribe(
    (event) => {
      // Undefined for a SimulatedPlayer in the release pack (see legendary/craftgate.ts).
      const player: Player | undefined = event.player;
      if (player === undefined || !player.isValid || !isBare(event.itemStack)) return;
      convertBareRockets(player);
    },
    { includeItems: [ROCKET] }
  );
  return () => world.afterEvents.playerInventoryItemChange.unsubscribe(handler);
}
