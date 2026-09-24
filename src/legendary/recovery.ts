// Loss return for every legendary item (Scythe spec §1, applied to all
// legendaries by decision-legendary-rules-obschie-dlya-vseh-legendarnyh).
//
// The stable API has no way to make an item entity indestructible, so the rule
// is "destroyed means returned": a marked instance lying on the ground is
// watched, and when it vanishes without having reached an inventory — Void,
// lava, fire, cactus, explosion, despawn — its owner (the mark's `owner`) is
// owed it back through the same pending mark death retention uses. The craft
// right is never reopened (Q-014).
//
// Watching is event-driven, never a world scan: entitySpawn/entityLoad add an
// entity, and a 2 s interval, alive only while something is watched, checks
// just those entities. [src: webswordspecv1ruen §11]
//
// Telling a loss from a pickup: a pickup also invalidates the entity. It is a
// pickup when the instance id surfaced in a player inventory
// (playerInventoryItemChange) since the entity was watched, is in an online
// player's inventory now, lies on the ground as another watched entity, or sits
// in a container right at the spot (a hopper). Only then is nothing owed.

import {
  type Dimension,
  type Entity,
  type Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { LEGENDARIES, type LegendaryDef, defForStack } from "./registry";
import { restore } from "./retention";
import { getMark, getPending, isItemOf, setPending } from "./state";
import { type Mark, parseMark, serializeMark } from "./rules";

const CHECK_INTERVAL_TICKS = 40;

const RECOVERED_KEY = "andrew.legendary.recovered";

interface Watched {
  entity: Entity;
  def: LegendaryDef;
  mark: Mark;
  dimension: Dimension;
  location: Vector3;
}

const watched = new Map<string, Watched>();

/** Instance ids that entered a player inventory since they were last watched. */
const seenInInventory = new Set<string>();

let intervalId: number | undefined;

/** Stops watching an entity this module must not treat as lost (retention path B). */
export function forgetWatched(entityId: string): void {
  watched.delete(entityId);
  stopIfIdle();
}

export function registerRecovery(): void {
  world.afterEvents.entitySpawn.subscribe((event) => {
    watch(event.entity, "entitySpawn");
  });
  // Items in a chunk that unloaded are dropped from the watch set, and a
  // restart empties it; either way they come back through entityLoad.
  world.afterEvents.entityLoad.subscribe((event) => {
    watch(event.entity, "entityLoad");
  });

  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const stack = event.itemStack;
    const def = defForStack(stack);
    if (def === undefined || stack === undefined) {
      return;
    }
    const id = getMark(def, stack)?.id;
    if (id === undefined || ![...watched.values()].some((w) => w.mark.id === id)) {
      return;
    }
    // The event also fires for the drop that created the entity, still
    // naming the stack; only a slot that holds the instance now is a pickup.
    const player: Player | undefined = event.player;
    const now = player?.getComponent("minecraft:inventory")?.container?.getItem(event.slot);
    if (isItemOf(def, now) && getMark(def, now)?.id === id) {
      seenInInventory.add(id);
    }
  });

  world.afterEvents.playerSpawn.subscribe((event) => {
    const player: Player | undefined = event.player;
    if (player === undefined) {
      return;
    }
    system.run(() => {
      for (const def of LEGENDARIES) {
        redeemOwed(def, player);
      }
    });
  });

  console.warn("[andrew] legendary loss recovery armed");
}

function watch(entity: Entity, via: string): void {
  if (entity.typeId !== "minecraft:item" || !entity.isValid) {
    return;
  }
  const stack = entity.getComponent("minecraft:item")?.itemStack;
  const def = defForStack(stack);
  if (def === undefined || stack === undefined) {
    return;
  }
  const mark = getMark(def, stack);
  if (mark === undefined) {
    // Unmarked Creative copies keep vanilla destruction.
    return;
  }
  watched.set(entity.id, { entity, def, mark, dimension: entity.dimension, location: entity.location });
  seenInInventory.delete(mark.id);
  console.warn(`[andrew] legendary recovery: watching ${def.itemId} id ${mark.id} on the ground (via ${via})`);
  if (intervalId === undefined) {
    intervalId = system.runInterval(check, CHECK_INTERVAL_TICKS);
  }
}

function stopIfIdle(): void {
  if (watched.size === 0 && intervalId !== undefined) {
    system.clearRun(intervalId);
    intervalId = undefined;
  }
}

function check(): void {
  for (const [entityId, w] of [...watched]) {
    const location = liveLocation(w.entity);
    if (location !== undefined) {
      if (location.y >= w.dimension.heightRange.min) {
        w.location = location;
        continue;
      }
      // Below the floor the engine kills it on its own schedule; taking it
      // now makes the Void a loss we control rather than one we infer.
      watched.delete(entityId);
      w.entity.remove();
      lost(w, "fell into the Void");
      continue;
    }

    watched.delete(entityId);
    if (!w.dimension.isChunkLoaded(w.location)) {
      // Unloaded with its chunk, not destroyed: entityLoad re-watches it.
      console.warn(`[andrew] legendary recovery: ${w.def.itemId} id ${w.mark.id} unloaded with its chunk`);
      continue;
    }
    const holder = whereIs(w);
    if (holder !== undefined) {
      console.warn(`[andrew] legendary recovery: ${w.def.itemId} id ${w.mark.id} picked up — ${holder}`);
      continue;
    }
    lost(w, "vanished from the ground");
  }
  stopIfIdle();
}

/** The entity's location, or undefined once the engine has removed it. */
function liveLocation(entity: Entity): Vector3 | undefined {
  if (!entity.isValid) {
    return undefined;
  }
  try {
    return entity.location;
  } catch {
    // isValid can lag the removal by a tick; reading a removed entity throws.
    return undefined;
  }
}

/** Where the instance went if it was not destroyed, or undefined. */
function whereIs(w: Watched): string | undefined {
  const id = w.mark.id;
  if (seenInInventory.delete(id)) {
    return "seen entering an inventory (playerInventoryItemChange)";
  }
  for (const other of watched.values()) {
    if (other.mark.id === id) {
      return "lying on the ground as another entity";
    }
  }
  for (const player of world.getAllPlayers()) {
    const container = player?.getComponent("minecraft:inventory")?.container;
    if (container === undefined) {
      continue;
    }
    for (let slot = 0; slot < container.size; slot++) {
      const stack = container.getItem(slot);
      if (isItemOf(w.def, stack) && getMark(w.def, stack)?.id === id) {
        return `in ${player.name}'s inventory`;
      }
    }
  }
  // A hopper pulls items from the block above it, so the spot and the cell
  // below are the only containers that can take an item without a player.
  for (const dy of [0, -1]) {
    const at = { x: w.location.x, y: w.location.y + dy, z: w.location.z };
    const container = w.dimension.getBlock(at)?.getComponent("minecraft:inventory")?.container;
    if (container === undefined) {
      continue;
    }
    for (let slot = 0; slot < container.size; slot++) {
      const stack = container.getItem(slot);
      if (isItemOf(w.def, stack) && getMark(w.def, stack)?.id === id) {
        return "in a container at the spot";
      }
    }
  }
  return undefined;
}

function lost(w: Watched, how: string): void {
  const owner = world.getAllPlayers().find((player) => player?.isValid && player.id === w.mark.owner);
  console.warn(
    `[andrew] legendary recovery: ${w.def.itemId} id ${w.mark.id} ${how}; ` +
      (owner === undefined ? `owner ${w.mark.owner} offline, owed on next join` : `returning to ${owner.name}`)
  );
  if (owner === undefined) {
    setOwed(w.def, w.mark.owner, w.mark);
    return;
  }
  setPending(w.def, owner, w.mark);
  system.run(() => {
    restore(w.def, owner, RECOVERED_KEY);
  });
}

/** World property: owner id -> serialized mark, for owners offline at the loss. */
function owedKey(def: LegendaryDef): string {
  return `andrew:${def.keyPrefix}_owed`;
}

function readOwed(def: LegendaryDef): Record<string, string> {
  const raw = world.getDynamicProperty(owedKey(def));
  if (typeof raw !== "string") {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function setOwed(def: LegendaryDef, ownerId: string, mark: Mark): void {
  const owed = readOwed(def);
  owed[ownerId] = serializeMark(mark);
  world.setDynamicProperty(owedKey(def), JSON.stringify(owed));
}

function redeemOwed(def: LegendaryDef, player: Player): void {
  if (!player.isValid) {
    return;
  }
  const owed = readOwed(def);
  const raw = owed[player.id];
  if (raw === undefined) {
    return;
  }
  const mark = parseMark(raw);
  // Order: the pending mark is durable before the world entry goes, so a
  // throw in between leaves the debt recorded twice, never zero times.
  if (mark !== undefined && getPending(def, player) === undefined) {
    setPending(def, player, mark);
  }
  delete owed[player.id];
  world.setDynamicProperty(owedKey(def), JSON.stringify(owed));
  restore(def, player, RECOVERED_KEY);
}

