// What a binding needs from outside the rod to be honoured after a world restart (spec v3 §7: «успешная привязка
// должна сохраняться при перезапуске мира»): the key a record names its binder by, and that binder's life epoch.
// The record itself rides on the rod (item dynamic properties, bind-rules.ts) and the plate generations live in the
// world (generation-rules.ts); both are saved with the world. The life epoch is kept twice: on the player, and in the
// world under the player's key, where it is readable while its player is offline.

import { type Player, world } from "@minecraft/server";
import { LIFE_EPOCH_KEY } from "./bind-rules";
import { nextLifeEpoch } from "./owner-rules";

/** World dynamic property per player key: the life epoch. */
export const EPOCH_PREFIX = "andrew:le:";

export const epochKey = (playerKey: string): string => `${EPOCH_PREFIX}${playerKey}`;

/** A stored epoch is a whole number from 0 up; anything else counts as no value. */
export function epochValue(raw: unknown): number | undefined {
  return typeof raw === "number" && Number.isSafeInteger(raw) && raw >= 0 ? raw : undefined;
}

/**
 * The epoch from both copies: the larger one. A copy that is lost or garbled never lowers the epoch, so it can never
 * bring a dead binding back; worlds saved before the world copy existed hold only the player copy.
 */
export function mergedEpoch(onPlayer: unknown, inWorld: unknown): number {
  return Math.max(epochValue(onPlayer) ?? 0, epochValue(inWorld) ?? 0);
}

type KeyOf = (player: Player) => string | undefined;

let keyOverride: KeyOf | undefined;

/**
 * GameTest pack only. A SimulatedPlayer spawned again after a restart has a new id and no dynamic properties, where a
 * client keeps both, so the restart scenarios name their own players by a key that survives. Undefined (the release
 * pack) or an undefined answer means `Player.id`.
 */
export function setPlayerKeyOverride(fn: KeyOf | undefined): void {
  keyOverride = fn;
}

/**
 * The key a binding names its binder by. `Player.id` "is intended to be consistent across loads of a world instance"
 * (@minecraft/server 2.10.0, `Entity.id`); a SimulatedPlayer breaks that, a client is not measured on BDS.
 */
export function playerKey(player: Player): string {
  if (keyOverride !== undefined) {
    try {
      const key = keyOverride(player);
      if (typeof key === "string" && key.length > 0) return key;
    } catch {
      // An after-event can carry a removed player whose name no longer reads; its id still does.
    }
  }
  return player.id;
}

export function lifeEpochOf(player: Player): number {
  return mergedEpoch(player.getDynamicProperty(LIFE_EPOCH_KEY), world.getDynamicProperty(epochKey(playerKey(player))));
}

/** The world copy of a player's epoch, online or not; undefined when none is stored. */
export function storedEpoch(key: string): number | undefined {
  return epochValue(world.getDynamicProperty(epochKey(key)));
}

/** A death: one past the current epoch, written to both copies. Returns the new epoch. */
export function endLife(player: Player): number {
  const next = nextLifeEpoch(lifeEpochOf(player));
  player.setDynamicProperty(LIFE_EPOCH_KEY, next);
  world.setDynamicProperty(epochKey(playerKey(player)), next);
  return next;
}
