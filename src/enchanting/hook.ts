// Spec v3 §4 on the engine, option a′ — Andrey's choice of 25.10: after an ordinary enchant, sometimes add ONE
// treasure enchantment, and never remove or change one that is already there.
//
// The vanilla table has no event in stable 2.10.0 (proven by sweeping all 75 world events), so a generation is
// recognised from the only two signals it leaves (docs/feedback/probe-enchanting.md §1-§2):
//   - the enchanted stack does not change in place: it leaves the inventory into the table's slot and comes back as a
//     fresh arrival, an unknown number of ticks later;
//   - the level drop raises no event at all and is visible only by polling `player.level`.
//
// No separator between the table and the anvil exists (probe §4: one signal disproved, two partial, the rest need a
// live client inside a screen). An anvil result therefore also gets the occasional extra. It can only gain — nothing
// is ever taken off — and that is the whole difference between a′ and (a), whose price was destroying a Mending book
// somebody combined on purpose. The partial signals (a renamed stack, the last block interacted with) are
// deliberately not used to refuse: each of them can also miss a real table generation, which would silently kill the
// feature. The last block is logged instead, so a complaint from the iPad has data behind it.

import { EnchantmentType, type ItemStack, type Player, system, world } from "@minecraft/server";
import { type Arrival, additionFor, pairArrival, tierFromDrop } from "./hook-rules";
import { type Rng, rollEnchantments } from "./roll";

/** On the stack, not on the player: one generation is one draw, however the stack moves afterwards. */
const MARK = "andrew:ench_seen";
const POLL_TICKS = 5;

interface Watch {
  level: number;
  arrivals: Arrival[];
  lastBlock?: string;
}

/** Counters a GameTest reads to tell one refusal from another. */
export const enchStats = { generations: 0, added: 0, refusedByEngine: 0, noAddition: 0, errors: 0 };

const log = (msg: string): void => console.warn(`[andrew] ench add: ${msg}`);

function isEnchanted(stack: ItemStack | undefined): boolean {
  return (stack?.getComponent("minecraft:enchantable")?.getEnchantments().length ?? 0) > 0;
}

function apply(player: Player, arrival: Arrival, tier: 1 | 2 | 3, rng: Rng, lastBlock: string | undefined): void {
  const container = player.getComponent("minecraft:inventory")?.container;
  const stack = container?.getItem(arrival.slot);
  const enchantable = stack?.getComponent("minecraft:enchantable");
  if (container === undefined || stack === undefined || enchantable === undefined) return;
  if (stack.getDynamicProperty(MARK) !== undefined) return;
  const present = new Set(enchantable.getEnchantments().map((e) => e.type.id));
  if (present.size === 0) return;

  enchStats.generations += 1;
  // Marked before the roll and whatever the roll says: moving the stack must not buy a second 20 % draw.
  stack.setDynamicProperty(MARK, 1);
  const roll = rollEnchantments({ itemId: stack.typeId, tier, rng });
  const addition = additionFor(roll, present);
  const at = `${stack.typeId} tier=${tier} rare=${roll.rareStage} had=[${[...present].join(",")}] block=${lastBlock ?? "?"}`;

  if (addition === undefined) {
    container.setItem(arrival.slot, stack);
    enchStats.noAddition += 1;
    log(`${at} -> nothing added`);
    return;
  }

  const enchantment = { type: new EnchantmentType(addition.id), level: addition.level };
  let added = false;
  try {
    // canAddEnchantment throws on a vanilla conflict instead of returning false (ubow probe), so both paths are needed.
    if (enchantable.canAddEnchantment(enchantment)) {
      enchantable.addEnchantment(enchantment);
      added = true;
    }
  } catch {
    added = false;
  }
  container.setItem(arrival.slot, stack);
  if (added) enchStats.added += 1;
  else enchStats.refusedByEngine += 1;
  log(`${at} -> ${added ? "added" : "refused by the engine, kept as it was"} ${addition.id} ${addition.level}`);
}

function poll(rng: Rng): void {
  const now = system.currentTick;
  for (const player of world.getAllPlayers()) {
    // A product pack reads a SimulatedPlayer as an unusable entry, and an after-event can carry a removed player.
    if (player?.isValid !== true) continue;
    const seen = watched.get(player.id);
    if (seen === undefined) {
      watched.set(player.id, { level: player.level, arrivals: [] });
      continue;
    }
    const drop = seen.level - player.level;
    seen.level = player.level;
    seen.arrivals = seen.arrivals.filter((a) => now - a.tick <= 200);
    if (drop <= 0) continue;
    const tier = tierFromDrop(drop);
    const arrival = tier === undefined ? undefined : pairArrival(seen.arrivals, now);
    if (tier !== undefined && arrival !== undefined) {
      try {
        apply(player, arrival, tier, rng, seen.lastBlock);
      } catch (err) {
        enchStats.errors += 1;
        log(`threw for ${player.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      log(`level dropped by ${drop} for ${player.name} with ${tier === undefined ? "a cost no table charges" : "no stack arrival in the window"}`);
    }
    // One arrival may not pair with a second drop.
    seen.arrivals = [];
  }
}

const watched = new Map<string, Watch>();

/** Returns the unsubscribe, so a GameTest can arm its own copy with a seeded source for one scenario. */
export function registerEnchantAdd({ rng = Math.random }: { rng?: Rng } = {}): () => void {
  const arrival = world.afterEvents.playerInventoryItemChange.subscribe((event) => {
    const player: Player | undefined = event.player;
    if (player?.isValid !== true || !isEnchanted(event.itemStack)) return;
    if (event.itemStack?.getDynamicProperty(MARK) !== undefined) return;
    const seen = watched.get(player.id) ?? { level: player.level, arrivals: [] };
    seen.arrivals.push({ slot: event.slot, tick: system.currentTick });
    watched.set(player.id, seen);
  });
  const interact = world.afterEvents.playerInteractWithBlock.subscribe((event) => {
    const seen = watched.get(event.player.id);
    if (seen !== undefined) seen.lastBlock = event.block.typeId;
  });
  const interval = system.runInterval(() => poll(rng), POLL_TICKS);
  return () => {
    world.afterEvents.playerInventoryItemChange.unsubscribe(arrival);
    world.afterEvents.playerInteractWithBlock.unsubscribe(interact);
    system.clearRun(interval);
    watched.clear();
  };
}
