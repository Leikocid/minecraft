// Death retention for every legendary item (spec §4, §12).
//
// A marked instance must not stay on the ground when its owner dies, and must be
// back in that same owner's hands after respawn — without ever producing a
// second copy, through death, disconnect/reconnect or a server restart.
// [src: webswordspecv1ruen §4, §12; decision-q-016-sword-unlootable]
//
// Only *marked* instances are touched: a craft- or admin-stamped instance
// (Q-006). An unmarked Creative copy is an ordinary item and keeps vanilla
// death behaviour.
//
// The retain half runs twice, by design. The stable 2.10.0 surface does not
// document whether a player's inventory is still populated when entityDie
// fires, or whether the engine has already spat the contents out as item
// entities — and the answer is an engine fact, not a type. So both are handled:
//
//   path A — the item is still in the inventory: stash the mark and blank the
//            slot, so there is nothing left for the engine to drop;
//   path B — next tick, sweep the death spot for dropped item entities carrying
//            a marked item, stash the mark and delete them.
//
// Whichever fired says so in the server log, so a run tells you which one this
// engine actually uses.
//
// The restore half is guarded by the pending mark, which is a durable dynamic
// property on the player: it is the idempotency token. An item is handed back
// only when a pending mark exists, the mark is cleared the moment it is, and a
// player who somehow already carries that exact instance id gets nothing and has the
// pending cleared instead. That is what makes a doubled event, a reconnect and
// a restart all converge on exactly one item.

import {
  type Container,
  type Dimension,
  type Entity,
  ItemStack,
  Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { forgetWatched } from "./recovery";
import { LEGENDARIES, type LegendaryDef, defForStack } from "./registry";
import { type Mark } from "./rules";
import {
  carriesInstance,
  clearPending,
  findMarked,
  getMark,
  getPending,
  isLive,
  markItem,
  setPending,
  voidStale,
} from "./state";

/**
 * How far from the death spot to sweep for dropped items.
 *
 * Wider than the pickaxe scenarios' 4: those look for the drop of a single
 * known block, while a death scatters the whole inventory, and the engine
 * gives the stacks a sideways impulse as it spawns them.
 */
const DROP_SEARCH_RADIUS = 8;

export function registerRetention(): void {
  world.afterEvents.entityDie.subscribe((event) => {
    // Typed non-nullable. For a real player it is — but the engine passes
    // nothing it cannot marshal, and a SimulatedPlayer needs the beta gametest
    // binding this pack deliberately does not load. The GameTest pack arms its
    // own copy of this module for that case, exactly as the craft gate does.
    // [src: concept-constraint C-2]
    const dead: Entity | undefined = event.deadEntity;
    if (dead === undefined || dead.typeId !== "minecraft:player") {
      return;
    }
    if (!(dead instanceof Player)) {
      console.warn("[andrew] legendary retention: a player died with no readable entity binding, skipping");
      return;
    }
    retain(dead);
  });

  // Not filtered on `initialSpawn`: both halves matter. A normal respawn is
  // initialSpawn=false, and a player who died and then quit before respawning
  // comes back as initialSpawn=true — the pending mark is the same token for
  // both, so the handler simply asks whether one is owed.
  world.afterEvents.playerSpawn.subscribe((event) => {
    const player: Player | undefined = event.player;
    if (player === undefined || !LEGENDARIES.some((def) => getPending(def, player) !== undefined)) {
      return;
    }
    // Deferred a tick: at spawn time the inventory is not reliably writable
    // yet, and the pending mark is durable, so nothing is lost by waiting.
    system.run(() => {
      for (const def of LEGENDARIES) {
        restore(def, player);
      }
    });
  });

  console.warn("[andrew] legendary death retention armed");
}

/** Death: take the marked item out of the world and record who is owed it. */
function retain(player: Player): void {
  // Read before deferring — the dead entity's location and dimension are what
  // the next-tick sweep needs, and by then the player may have respawned.
  const location = player.location;
  const dimension = player.dimension;

  const container = player.getComponent("minecraft:inventory")?.container;
  if (container !== undefined) {
    for (const def of LEGENDARIES) {
      // A superseded copy is deleted, not retained (R-lgnd-005).
      const voided = voidStale(def, container);
      if (voided > 0) {
        console.warn(`[andrew] legendary retention: path A — voided ${voided} stale ${def.itemId} on ${player.name}'s death`);
      }
      const found = findMarked(def, container);
      if (found === undefined) {
        console.warn(
          `[andrew] legendary retention: path A — ${player.name} had no marked ${def.itemId} in inventory at entityDie`
        );
        continue;
      }
      // Order: the mark is durable before the slot is blanked, so a throw in
      // between loses the item to the drop rather than to nothing at all.
      setPending(def, player, found.mark);
      container.setItem(found.slot, undefined);
      console.warn(
        `[andrew] legendary retention: path A — ${player.name} still held ${def.itemId} id ${found.mark.id} ` +
          `in slot ${found.slot} at entityDie; slot blanked before the engine could drop it`
      );
    }
  }

  system.run(() => {
    sweep(player, dimension, location);
  });
}

/**
 * Path B: the engine had already turned the inventory into item entities.
 *
 * A marked legendary lying on the ground is by construction something that should
 * not exist, so any found at the death spot are reclaimed for the player who
 * died there — that is also what keeps the item from changing hands in PvP
 * [src: decision-q-016-sword-unlootable].
 */
function sweep(player: Player, dimension: Dimension, location: Vector3): void {
  if (!player.isValid) {
    // Left the server within the tick. Deleting the drops now would destroy
    // the item with nobody holding a pending mark for it.
    console.warn("[andrew] legendary retention: path B — the dead player left, drops untouched");
    return;
  }

  let reclaimed = 0;
  for (const entity of dimension.getEntities({
    type: "minecraft:item",
    location,
    maxDistance: DROP_SEARCH_RADIUS,
  })) {
    const stack = entity.getComponent("minecraft:item")?.itemStack;
    const def = defForStack(stack);
    if (def === undefined || stack === undefined) {
      continue;
    }
    const mark = getMark(def, stack);
    if (mark === undefined) {
      // An unmarked copy is an ordinary item — vanilla rules, leave it lying.
      continue;
    }
    const live = isLive(def, mark);
    if (live && getPending(def, player) === undefined) {
      setPending(def, player, mark);
    }
    // Order: unwatched before removal, or recovery reads this removal as a
    // loss and owes the mark a second time.
    forgetWatched(entity.id);
    entity.remove();
    if (live) {
      reclaimed++;
    }
  }

  console.warn(
    reclaimed > 0
      ? `[andrew] legendary retention: path B — reclaimed ${reclaimed} dropped marked item(s) ` +
          `within ${DROP_SEARCH_RADIUS} blocks of ${player.name}'s death`
      : `[andrew] legendary retention: path B — no marked legendary on the ground within ` +
          `${DROP_SEARCH_RADIUS} blocks of ${player.name}'s death`
  );
}

/** Hand the item retained on death back, once. Called on respawn/join; `messageKey` is what the owner is told. */
export function restore(def: LegendaryDef, player: Player, messageKey = `${def.textPrefix}.returned`): void {
  if (!player.isValid) {
    return;
  }
  // A dead player's inventory is emptied by the engine; the pending mark waits
  // for the respawn handler instead.
  const health = player.getComponent("minecraft:health");
  if (health !== undefined && health.currentValue <= 0) {
    return;
  }

  // Re-read rather than trusting the value the subscriber saw a tick ago.
  const mark = getPending(def, player);
  if (mark === undefined) {
    return;
  }

  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    // The mark is durable; the next spawn will try again.
    return;
  }

  if (!isLive(def, mark)) {
    // A loss return superseded this instance while the token waited.
    clearPending(def, player);
    console.warn(
      `[andrew] legendary retention: pending ${def.itemId} id ${mark.id} gen ${mark.gen} is stale, cleared without a copy`
    );
    return;
  }

  if (carriesInstance(def, container, mark)) {
    clearPending(def, player);
    console.warn(
      `[andrew] legendary retention: ${player.name} already carries ${def.itemId} id ${mark.id}, ` +
        "pending cleared without issuing a second copy"
    );
    return;
  }

  grant(def, player, container, mark, messageKey);
  clearPending(def, player);
}

/**
 * Hands `player` a fresh stack stamped with `mark` and tells them. Every return
 * path goes through here; the caller owns the token that makes it happen once.
 */
export function grant(def: LegendaryDef, player: Player, container: Container, mark: Mark, messageKey: string): void {
  const leftover = container.addItem(markItem(def, new ItemStack(def.itemId, 1), mark));
  if (leftover !== undefined) {
    // Nowhere in the inventory to put it. At their feet is still "returned to
    // the owner", and it beats destroying the world's only copy.
    player.dimension.spawnItem(leftover, player.location);
  }
  player.sendMessage({ translate: messageKey });
  console.warn(
    `[andrew] legendary retention: returned ${def.itemId} id ${mark.id} gen ${mark.gen} to ${player.name}` +
      (leftover === undefined ? "" : " (inventory full — dropped at their feet)")
  );
}
