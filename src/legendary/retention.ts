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
//   path A — the items are still in the inventory or the off hand: stash every
//            marked one and blank its slot, so there is nothing left for the
//            engine to drop;
//   path B — next tick, sweep the death spot for dropped item entities carrying
//            a marked item, stash each mark and delete them.
//
// Whichever fired says so in the server log, so a run tells you which one this
// engine actually uses. On BDS 1.26.51.1 the death drops spawn before
// entityDie, so path B does all the work (CNTR-LGND-CX10-AA).
//
// The restore half is guarded by the pending list, a durable dynamic property
// on the player holding one mark per retained instance: each entry is the
// idempotency token for its item. An item is handed back only while its entry
// exists, the entry is removed the moment it is, and a player who somehow
// already carries that exact instance id gets nothing and loses the entry
// instead. That is what makes a doubled event, a reconnect and a restart all
// converge on exactly one item per instance.

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
import { type Mark, withoutPending } from "./rules";
import {
  addPending,
  carriesInstance,
  findAllMarked,
  getMark,
  isItemOf,
  isLive,
  isStale,
  markItem,
  offhandOf,
  readPending,
  setOffhand,
  voidStale,
  writePending,
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
  // comes back as initialSpawn=true — the pending list is the same token for
  // both, so the handler simply asks whether anything is owed.
  world.afterEvents.playerSpawn.subscribe((event) => {
    const player: Player | undefined = event.player;
    if (player === undefined || !LEGENDARIES.some((def) => readPending(def, player).length > 0)) {
      return;
    }
    // Deferred a tick: at spawn time the inventory is not reliably writable
    // yet, and the pending list is durable, so nothing is lost by waiting.
    system.run(() => {
      for (const def of LEGENDARIES) {
        restore(def, player);
      }
    });
  });

  console.warn("[andrew] legendary death retention armed");
}

/** Death: take every marked item out of the world and record who is owed it. */
function retain(player: Player): void {
  // Read before deferring — the dead entity's location and dimension are what
  // the next-tick sweep needs, and by then the player may have respawned.
  const location = player.location;
  const dimension = player.dimension;
  // Scheduled first, so a throw in path A below cannot cost the sweep.
  system.run(() => {
    sweep(player, dimension, location);
  });

  const container = player.getComponent("minecraft:inventory")?.container;
  for (const def of LEGENDARIES) {
    // A superseded copy is deleted, not retained (R-lgnd-005).
    const voided = (container === undefined ? 0 : voidStale(def, container)) + voidStaleOffhand(def, player);
    if (voided > 0) {
      console.warn(`[andrew] legendary retention: path A — voided ${voided} stale ${def.itemId} on ${player.name}'s death`);
    }
    const found = container === undefined ? [] : findAllMarked(def, container);
    const offhand = offhandOf(player);
    const offMark = isItemOf(def, offhand) ? getMark(def, offhand) : undefined;
    const marks = [...found.map((f) => f.mark), ...(offMark === undefined ? [] : [offMark])];
    if (marks.length === 0) {
      console.warn(
        `[andrew] legendary retention: path A — ${player.name} had no marked ${def.itemId} in inventory or off hand at entityDie`
      );
      continue;
    }
    // Order: the marks are durable before the slots are blanked, so a throw in
    // between loses an item to the drop rather than to nothing at all.
    addPending(def, player, marks);
    for (const f of found) {
      container?.setItem(f.slot, undefined);
    }
    if (offMark !== undefined) {
      setOffhand(player, undefined);
    }
    const where = [...found.map((f) => `slot ${f.slot}`), ...(offMark === undefined ? [] : ["the off hand"])];
    console.warn(
      `[andrew] legendary retention: path A — ${player.name} still held ${marks.length} marked ${def.itemId} ` +
        `(ids ${marks.map((m) => m.id).join(", ")}; ${where.join(", ")}) at entityDie; emptied before the engine could drop them`
    );
  }
}

/** Empties the off hand if it holds a stale copy of `def`; returns how many (0 or 1). */
function voidStaleOffhand(def: LegendaryDef, player: Player): number {
  const offhand = offhandOf(player);
  if (!isItemOf(def, offhand) || !isStale(def, offhand)) {
    return 0;
  }
  setOffhand(player, undefined);
  return 1;
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
    if (live) {
      addPending(def, player, [mark]);
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

/** Hand every item retained on death back, each once. Called on respawn/join; `messageKey` is what the owner is told. */
export function restore(def: LegendaryDef, player: Player, messageKey = `${def.textPrefix}.returned`): void {
  if (!player.isValid) {
    return;
  }
  // A dead player's inventory is emptied by the engine; the pending list waits
  // for the respawn handler instead.
  const health = player.getComponent("minecraft:health");
  if (health !== undefined && health.currentValue <= 0) {
    return;
  }

  // Re-read rather than trusting the value the subscriber saw a tick ago.
  const marks = readPending(def, player);
  if (marks.length === 0) {
    return;
  }

  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    // The list is durable; the next spawn will try again.
    return;
  }

  for (const mark of marks) {
    if (!isLive(def, mark)) {
      // A loss return superseded this instance while the token waited.
      console.warn(
        `[andrew] legendary retention: pending ${def.itemId} id ${mark.id} gen ${mark.gen} is stale, cleared without a copy`
      );
    } else if (carriesInstance(def, player, container, mark)) {
      console.warn(
        `[andrew] legendary retention: ${player.name} already carries ${def.itemId} id ${mark.id}, ` +
          "pending entry cleared without issuing a second copy"
      );
    } else {
      grant(def, player, container, mark, messageKey);
    }
    // Order: the entry goes after its grant, so a throw in between leaves a
    // token the next spawn drops as already carried, never a lost return.
    writePending(def, player, withoutPending(readPending(def, player), mark));
  }
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
