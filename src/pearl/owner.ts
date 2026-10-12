// The binding belongs to a living player (spec v3 §7; C-45, L0-pear-ent2): a player's death bumps their life epoch,
// which voids every binding they made wherever the rod is. The decisions are in owner-rules.ts; this module is the
// engine half — deaths in, the epoch out, and the checks the use gate and a trip in progress read.

import { type Entity, type ItemStack, Player, world } from "@minecraft/server";
import { bindingOf, lifeEpochOf } from "./bind";
import { type Binding, LIFE_EPOCH_KEY } from "./bind-rules";
import { type Holder, type Honour, honourOf, nextLifeEpoch, tripSurvives } from "./owner-rules";

/** Counters a GameTest reads to tell what the module did. */
export const ownerStats = { deaths: 0 };

export function holderOf(player: Player): Holder {
  return { id: player.id, epoch: lifeEpochOf(player) };
}

export function honourFor(player: Player, stack: ItemStack | undefined): Honour {
  return honourOf(bindingOf(stack), holderOf(player));
}

/** The binding on `stack` when `player` may use it for a trip; undefined when the use is a vanilla cast. */
export function honouredBindingOf(player: Player, stack: ItemStack | undefined): Binding | undefined {
  const binding = bindingOf(stack);
  return honourOf(binding, holderOf(player)) === "honoured" ? binding : undefined;
}

/** Whether a trip `player` started in life `startEpoch` may go on this tick; false once they are dead or gone. */
export function stillInLife(player: Player, startEpoch: number): boolean {
  if (!player.isValid) return false;
  return tripSurvives(startEpoch, { health: player.getComponent("minecraft:health")?.currentValue ?? 0, epoch: lifeEpochOf(player) });
}

function endLife(player: Player): void {
  player.setDynamicProperty(LIFE_EPOCH_KEY, nextLifeEpoch(player.getDynamicProperty(LIFE_EPOCH_KEY)));
  ownerStats.deaths++;
}

export function registerPearlOwner(): void {
  world.afterEvents.entityDie.subscribe((event) => {
    // Typed non-nullable, but a pack without the gametest binding gets undefined for a SimulatedPlayer, and an
    // after-event can carry a removed entity.
    const dead: Entity | undefined = event.deadEntity;
    if (dead === undefined || dead.typeId !== "minecraft:player" || !(dead instanceof Player) || !dead.isValid) return;
    endLife(dead);
  });
  console.warn("[andrew] pearl rod owner armed");
}
