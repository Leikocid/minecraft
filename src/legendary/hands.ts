// Main-hand / off-hand priority between legendary items
// [src: decision-legendary-hand-priority; scythe spec §6].

import { EntityComponentTypes, EquipmentSlot, type ItemStack, type Player } from "@minecraft/server";
import { isBusy, isReady } from "./cooldown";
import { type ActiveLegendaryDef, type LegendaryDef, defForStack, hasAbility } from "./registry";
import { isStale } from "./state";

export type HandSlot = EquipmentSlot.Mainhand | EquipmentSlot.Offhand;

export interface HeldLegendary {
  def: LegendaryDef;
  slot: HandSlot;
  stack: ItemStack;
}

/** Legendary items in the main hand, then the off hand. A stale copy is not one (R-lgnd-005). */
export function heldLegendaries(player: Player): HeldLegendary[] {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  const held: HeldLegendary[] = [];
  for (const slot of [EquipmentSlot.Mainhand, EquipmentSlot.Offhand] as const) {
    const stack = equippable?.getEquipment(slot);
    const def = defForStack(stack);
    if (def !== undefined && stack !== undefined && !isStale(def, stack)) {
      held.push({ def, slot, stack });
    }
  }
  return held;
}

/**
 * Which held legendary a Use activates: the main hand when it is ready and
 * not busy, otherwise a ready, idle off hand, otherwise none. A passive
 * legendary counts as no ready ability, so it never masks the other hand
 * (R-lgnd-018).
 */
export function resolveActivation(player: Player): { def: ActiveLegendaryDef; slot: HandSlot } | undefined {
  for (const { def, slot } of heldLegendaries(player)) {
    if (hasAbility(def) && isReady(player, def.abilityKey) && !isBusy(player, def.abilityKey)) {
      return { def, slot };
    }
  }
  return undefined;
}
