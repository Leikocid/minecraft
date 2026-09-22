// Death retention for the Web Sword (spec §4, §12).
//
// A marked sword must not stay on the ground when its owner dies, and must be
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
//   path A — the sword is still in the inventory: stash the mark and blank the
//            slot, so there is nothing left for the engine to drop;
//   path B — next tick, sweep the death spot for dropped item entities carrying
//            a marked sword, stash the mark and delete them.
//
// Whichever fired says so in the server log, so a run tells you which one this
// engine actually uses.
//
// The restore half is guarded by the pending mark, which is a durable dynamic
// property on the player: it is the idempotency token. A sword is handed back
// only when a pending mark exists, the mark is cleared the moment it is, and a
// player who somehow already carries that exact ws_id gets nothing and has the
// pending cleared instead. That is what makes a doubled event, a reconnect and
// a restart all converge on exactly one sword.

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
import {
  WEB_SWORD_ID,
  clearPending,
  findMarkedSword,
  getMark,
  getPending,
  isWebSword,
  markSword,
  setPending,
} from "./state";

/**
 * How far from the death spot to sweep for dropped swords.
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
      console.warn("[andrew] web sword retention: a player died with no readable entity binding, skipping");
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
    if (player === undefined || getPending(player) === undefined) {
      return;
    }
    // Deferred a tick: at spawn time the inventory is not reliably writable
    // yet, and the pending mark is durable, so nothing is lost by waiting.
    system.run(() => {
      restore(player);
    });
  });

  console.warn("[andrew] web sword death retention armed");
}

/** Death: take the marked sword out of the world and record who is owed it. */
function retain(player: Player): void {
  // Read before deferring — the dead entity's location and dimension are what
  // the next-tick sweep needs, and by then the player may have respawned.
  const location = player.location;
  const dimension = player.dimension;

  const container = player.getComponent("minecraft:inventory")?.container;
  if (container !== undefined) {
    const found = findMarkedSword(container);
    if (found === undefined) {
      console.warn(
        `[andrew] web sword retention: path A — ${player.name} had no marked sword in inventory at entityDie`
      );
    } else {
      // Order: the mark is durable before the slot is blanked, so a throw in
      // between loses the sword to the drop rather than to nothing at all.
      setPending(player, found.mark);
      container.setItem(found.slot, undefined);
      console.warn(
        `[andrew] web sword retention: path A — ${player.name} still held ws_id ${found.mark.id} ` +
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
 * A marked sword lying on the ground is by construction something that should
 * not exist, so any found at the death spot are reclaimed for the player who
 * died there — that is also what keeps the sword from changing hands in PvP
 * [src: decision-q-016-sword-unlootable].
 */
function sweep(player: Player, dimension: Dimension, location: Vector3): void {
  if (!player.isValid) {
    // Left the server within the tick. Deleting the drops now would destroy
    // the sword with nobody holding a pending mark for it.
    console.warn("[andrew] web sword retention: path B — the dead player left, drops untouched");
    return;
  }

  let reclaimed = 0;
  for (const entity of dimension.getEntities({
    type: "minecraft:item",
    location,
    maxDistance: DROP_SEARCH_RADIUS,
  })) {
    const stack = entity.getComponent("minecraft:item")?.itemStack;
    if (!isWebSword(stack)) {
      continue;
    }
    const mark = getMark(stack);
    if (mark === undefined) {
      // An unmarked copy is an ordinary item — vanilla rules, leave it lying.
      continue;
    }
    if (getPending(player) === undefined) {
      setPending(player, mark);
    }
    entity.remove();
    reclaimed++;
  }

  console.warn(
    reclaimed > 0
      ? `[andrew] web sword retention: path B — reclaimed ${reclaimed} dropped marked sword(s) ` +
          `within ${DROP_SEARCH_RADIUS} blocks of ${player.name}'s death`
      : `[andrew] web sword retention: path B — no marked sword on the ground within ` +
          `${DROP_SEARCH_RADIUS} blocks of ${player.name}'s death`
  );
}

/** Respawn (or the next join after one): hand the owed sword back, once. */
function restore(player: Player): void {
  if (!player.isValid) {
    return;
  }

  // Re-read rather than trusting the value the subscriber saw: the release
  // pack and the GameTest pack both arm this module in the same world, and
  // whichever gets there first clears the mark for the other.
  const mark = getPending(player);
  if (mark === undefined) {
    return;
  }

  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    // The mark is durable; the next spawn will try again.
    return;
  }

  if (carriesInstance(container, mark.id)) {
    clearPending(player);
    console.warn(
      `[andrew] web sword retention: ${player.name} already carries ws_id ${mark.id}, ` +
        "pending cleared without issuing a second copy"
    );
    return;
  }

  const leftover = container.addItem(markSword(new ItemStack(WEB_SWORD_ID, 1), mark));
  if (leftover !== undefined) {
    // Nowhere in the inventory to put it. At their feet is still "returned to
    // the owner", and it beats destroying the world's only sword.
    player.dimension.spawnItem(leftover, player.location);
  }
  clearPending(player);
  player.sendMessage({ translate: "andrew.web_sword.returned" });
  console.warn(
    `[andrew] web sword retention: returned ws_id ${mark.id} to ${player.name}` +
      (leftover === undefined ? "" : " (inventory full — dropped at their feet)")
  );
}

/** Whether `container` already holds the Web Sword instance `id`. */
function carriesInstance(container: Container, id: string): boolean {
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (isWebSword(stack) && getMark(stack)?.id === id) {
      return true;
    }
  }
  return false;
}
