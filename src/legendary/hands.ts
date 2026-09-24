// Main-hand / off-hand priority between legendary items
// [src: decision-legendary-hand-priority; scythe spec §6].

import { EntityComponentTypes, EquipmentSlot, type ItemStack, type Player } from "@minecraft/server";
import { isBusy, isReady } from "./cooldown";
import { type LegendaryDef, defForStack } from "./registry";

export type HandSlot = EquipmentSlot.Mainhand | EquipmentSlot.Offhand;

export interface HeldLegendary {
  def: LegendaryDef;
  slot: HandSlot;
  stack: ItemStack;
}

/** Legendary items in the main hand, then the off hand. */
export function heldLegendaries(player: Player): HeldLegendary[] {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held: HeldLegendary[] = [];
  for (const slot of [EquipmentSlot.Mainhand, EquipmentSlot.Offhand] as const) {
    const stack = equippable?.getEquipment(slot);
    const def = defForStack(stack);
    if (def !== undefined && stack !== undefined) {
      held.push({ def, slot, stack });
    }
  }
  return held;
}

/**
 * Which held legendary a Use activates: the main hand when it is ready and
 * not busy, otherwise a ready, idle off hand, otherwise none.
 */
export function resolveActivation(player: Player): { def: LegendaryDef; slot: HandSlot } | undefined {
  for (const { def, slot } of heldLegendaries(player)) {
    if (isReady(player, def.abilityKey) && !isBusy(player, def.abilityKey)) {
      return { def, slot };
    }
  }
  return undefined;
}
