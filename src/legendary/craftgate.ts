// One survival craft per world for every legendary with `craftGate` (spec §3).
//
// The stable @minecraft/server 2.10.0 surface has no "before craft" event, so
// the gate cannot veto the recipe. It works the only way the stable API allows:
// by noticing an *unmarked* legendary item appearing in a player's inventory
// and deciding after the fact — keep it and claim the world's single craft, or
// take it back and return the ingredients.
// [src: decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut]
//
// The decision itself is not made here: rules.craftDecision() owns it, so the
// Creative/Spectator exemption and the already-marked exemption are testable
// off the engine. This module is the engine half — events in, container writes
// and messages out.

import { type Container, ItemStack, type Player, type RawMessage, system, world } from "@minecraft/server";
import { type LegendaryDef, defForStack } from "./registry";
import { craftDecision } from "./rules";
import { getMark, isCrafted, isItemOf, makeMark, markItem, setCrafted } from "./state";

// Known limitation, not fixable on this surface: refund items (def.refund) are
// *new* stacks. By the time an unmarked result exists the ingredients are gone,
// so their enchantments and durability are not restored.
// [src: decision-q-008-blocked-craft-refund-a-obnaruzhit-i-vernut]

/**
 * Players with an unmarked sword seen this tick, in the order the engine
 * reported them. One craft touches several slots (the result slot, then the
 * inventory slot it is moved to), and each touch is its own event — so the
 * events are collected and the inventory is read once, rather than acting on
 * every one of them.
 */
const queued = new Map<string, Player>();

let flushScheduled = false;

export function registerCraftGate(): void {
  world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const stack = event.itemStack;
    const def = defForStack(stack);
    if (def === undefined || !def.craftGate || stack === undefined || getMark(def, stack) !== undefined) {
      return;
    }

    // `player` is typed non-nullable and for a real player it is. It comes back
    // undefined for a SimulatedPlayer: that class lives in the beta gametest
    // module, which this pack deliberately does not load, so the engine has no
    // binding to marshal the holder into. [src: concept-constraint C-2]
    //
    // There is nothing to fall back on — measured on BDS 1.26.51.1,
    // world.getAllPlayers() in that situation returns the right *count* with
    // every entry undefined as well, so this pack cannot reach that inventory
    // by any route. The GameTest pack owns the binding and arms its own copy of
    // this gate instead; see src/gametest/main.ts.
    const holder: Player | undefined = event.player;
    if (holder === undefined) {
      console.warn(`[andrew] legendary gate: an unmarked ${def.itemId} was reported with no readable holder`);
      return;
    }
    queued.set(holder.id, holder);

    if (flushScheduled) {
      return;
    }
    flushScheduled = true;
    system.run(flush);
  });

  console.warn("[andrew] legendary craft gate armed");
}

/**
 * Settle every player queued this tick, one after another.
 *
 * Sequential on purpose: this is where the §9 craft race is decided. Two
 * players who craft on the same tick are both in the queue, `isCrafted()` is
 * re-read for each sword, and so exactly one of them claims the world's budget
 * while the other is refunded.
 */
function flush(): void {
  flushScheduled = false;
  const players = [...queued.values()];
  queued.clear();

  for (const player of players) {
    if (!player.isValid) {
      // Left the server between the event and this tick. Nothing was claimed
      // on their behalf, so there is nothing to undo.
      continue;
    }
    try {
      gate(player);
    } catch (err) {
      // One player's failure must not swallow the rest of the queue — and a
      // silent throw here would leave an unmarked sword in the world, which is
      // the one outcome the gate exists to prevent.
      const why = err instanceof Error ? err.message : String(err);
      console.warn(`[andrew] legendary craft gate failed for ${player.name}: ${why}`);
    }
  }
}

function gate(player: Player): void {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) {
    return;
  }

  // The whole inventory rather than the event's slot index: a craft can land
  // in more than one slot, and a shift-click bulk craft in several at once.
  // This runs only when an unmarked sword was reported, never per tick (C-4).
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    const def = defForStack(stack);
    if (def === undefined || !def.craftGate || !isItemOf(def, stack) || getMark(def, stack) !== undefined) {
      continue;
    }

    switch (craftDecision({ crafted: isCrafted(def), gameMode: player.getGameMode(), marked: false })) {
      case "ignore":
        break;
      case "claim":
        claim(def, player, container, slot, stack);
        break;
      case "refund":
        refund(def, player, container, slot);
        break;
    }
  }
}

/**
 * First survival craft: stamp the instance and spend the world's budget.
 *
 * Order is load-bearing — the sword is marked and written back *before* the
 * flag is claimed, so a throw in the middle leaves the budget unspent rather
 * than spent on a sword that never reached the player.
 */
function claim(def: LegendaryDef, player: Player, container: Container, slot: number, stack: ItemStack): void {
  container.setItem(slot, markItem(def, stack, makeMark("craft", player)));
  setCrafted(def, player.name);
  announce(def, player);
}

/**
 * §3 asks for "a localized message with the weapon's name and its creator's
 * name", which means a translate token nested inside the announcement's
 * arguments. The stable 2.10.0 surface documents `with` as "an array of strings
 * or RawMessage containing an array of raw text objects", so the nested form is
 * the documented one — but whether 1.26.51 accepts it is an engine question,
 * not a type question. The fallback keeps the announcement readable if it does
 * not, and the log line says which of the two ran.
 */
function announce(def: LegendaryDef, player: Player): void {
  const key = `${def.textPrefix}.first_craft`;
  const nested: RawMessage = {
    translate: key,
    with: { rawtext: [{ text: player.name }, { translate: def.nameKey }] },
  };

  try {
    world.sendMessage(nested);
    console.warn(
      `[andrew] ${def.itemId} first craft by ${player.name} — announced with a nested translate in "with"`
    );
  } catch (err) {
    const why = err instanceof Error ? err.message : String(err);
    world.sendMessage({ translate: key, with: [player.name, def.itemId] });
    console.warn(
      `[andrew] ${def.itemId} first craft by ${player.name} — nested translate in "with" rejected (${why}), ` +
        "announced with a plain weapon name instead"
    );
  }
}

/** The budget is already spent: take the item back, hand the ingredients over. */
function refund(def: LegendaryDef, player: Player, container: Container, slot: number): void {
  container.setItem(slot, undefined);
  for (const [itemId, count] of def.refund) {
    returnToPlayer(player, container, new ItemStack(itemId, count));
  }
  player.sendMessage({ translate: `${def.textPrefix}.craft_blocked` });
  console.warn(`[andrew] ${def.itemId} craft blocked for ${player.name} — ingredients returned`);
}

/** Into the inventory, or at the player's feet when there is no room for it. */
function returnToPlayer(player: Player, container: Container, stack: ItemStack): void {
  const leftover = container.addItem(stack);
  if (leftover !== undefined) {
    player.dimension.spawnItem(leftover, player.location);
  }
}
