// The binding belongs to a living player (spec v3 §7; C-45, L0-pear-ent2): a player's death bumps their life epoch,
// which voids every binding they made wherever the rod is, and ends any trip they have in progress. The decisions are in
// owner-rules.ts; this module is the engine half — deaths in, the epoch and the trip aborts out.

import { type Entity, type ItemStack, Player, world } from "@minecraft/server";
import { bindingOf, lifeEpochOf } from "./bind";
import { type Binding, LIFE_EPOCH_KEY } from "./bind-rules";
import { type Holder, type Honour, honourOf, nextLifeEpoch } from "./owner-rules";

/** Counters a GameTest reads to tell what the module did. */
export const ownerStats = { deaths: 0, listenerErrors: 0 };

/** Called with the dead player and their new epoch, in the entityDie that bumped it. */
export type LifeEndListener = (player: Player, epoch: number) => void;

const listeners: LifeEndListener[] = [];

/** A trip in progress subscribes here to be aborted by its traveller's death (`xasm42`: aborted, binding void, no message). */
export function onLifeEnd(listener: LifeEndListener): void {
  listeners.push(listener);
}

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

function endLife(player: Player): void {
  const epoch = nextLifeEpoch(player.getDynamicProperty(LIFE_EPOCH_KEY));
  player.setDynamicProperty(LIFE_EPOCH_KEY, epoch);
  ownerStats.deaths++;
  for (const listener of listeners) {
    try {
      listener(player, epoch);
    } catch (err) {
      ownerStats.listenerErrors++;
      const why = err instanceof Error ? err.message : String(err);
      console.warn(`[andrew] pearl rod: a life-end listener failed for ${player.name}: ${why}`);
    }
  }
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
