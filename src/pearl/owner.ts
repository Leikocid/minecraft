// The binding belongs to a living player (spec v3 §7; C-45, L0-pear-ent2): a player's death bumps their life epoch,
// which voids every binding they made wherever the rod is, with no search. A dead record is erased later, when the rod
// turns up in a player's inventory with its binder online. The decisions are in owner-rules.ts; this module is the
// engine half — deaths in, the epoch out, and the checks the use gate and a trip in progress read.

import { type Container, type Entity, type ItemStack, Player, world } from "@minecraft/server";
import { bindingOf, lifeEpochOf } from "./bind";
import { BINDING_KEYS, type Binding, LIFE_EPOCH_KEY } from "./bind-rules";
import { isPearlRodStack } from "./item";
import { MARK_KEY, unboundLore } from "./item-rules";
import { type Holder, type Honour, honourOf, isDeadRecord, nextLifeEpoch, tripSurvives } from "./owner-rules";

/** Counters a GameTest reads to tell what the module did. */
export const ownerStats = { deaths: 0, cleared: 0, errors: 0 };

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

/** The binder's epoch now, read off `holder` when it is the binder; undefined while the binder is offline. */
function binderEpoch(owner: string, holder: Player): number | undefined {
  if (owner === holder.id) return lifeEpochOf(holder);
  const binder = world.getEntity(owner);
  return binder instanceof Player && binder.isValid ? lifeEpochOf(binder) : undefined;
}

/** Erases a dead record from the rod in `slot`, with the lore back to "unbound"; true when it did. */
function clearIfDead(holder: Player, container: Container, slot: number): boolean {
  const stack = container.getItem(slot);
  const binding = bindingOf(stack);
  if (stack === undefined || !isDeadRecord(binding, binding === undefined ? undefined : binderEpoch(binding.owner, holder))) return false;
  for (const key of BINDING_KEYS) stack.setDynamicProperty(key, undefined);
  stack.setLore(unboundLore());
  container.setItem(slot, stack);
  ownerStats.cleared++;
  return true;
}

/** Every slot of `player`'s inventory, or only the one holding the rod `rodId`. */
function sweep(player: Player, rodId?: string): void {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) return;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (!isPearlRodStack(stack) || (rodId !== undefined && stack?.getDynamicProperty(MARK_KEY) !== rodId)) continue;
    clearIfDead(player, container, slot);
  }
}

function guarded(what: string, step: () => void): void {
  try {
    step();
  } catch (err) {
    ownerStats.errors++;
    const why = err instanceof Error ? err.message : String(err);
    console.warn(`[andrew] pearl rod: ${what} failed: ${why}`);
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

  // A pick-up, a chest take, a hand-over: the rod that arrived, found by its id (event.slot does not say which
  // container slot it names). The clear's own setItem raises this event again and finds the rod unbound.
  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const player: Player | undefined = event.player;
    const stack = event.itemStack;
    if (player === undefined || !player.isValid || !isPearlRodStack(stack) || bindingOf(stack) === undefined) return;
    const rodId = stack?.getDynamicProperty(MARK_KEY);
    if (typeof rodId === "string") guarded("the dead-record check on a pick-up", () => sweep(player, rodId));
  });

  // keepInventory leaves the rods in the inventory through a death, and a player can join holding a rod whose
  // binder died while they were away: neither raises an inventory change.
  world.afterEvents.playerSpawn.subscribe((event) => {
    const player: Player | undefined = event.player;
    if (player !== undefined && player.isValid) guarded("the dead-record check on a spawn", () => sweep(player));
  });
  console.warn("[andrew] pearl rod owner armed");
}
