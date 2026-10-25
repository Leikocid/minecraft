// When the two signals the engine does leave add up to a table generation, and what may be put on top of its result
// (spec v3 §4, option a′ — L0-xcx32, docs/feedback/probe-enchanting.md §2). Pure: no engine import, so the decisions
// are unit-tested without a world.

import type { EnchantRoll, RolledEnchantment } from "./roll";
import { type Tier, TREASURE } from "./roll-rules";

/**
 * The stack comes back from the table as a fresh arrival and the levels go separately, possibly many ticks apart, and
 * the drop is only ever noticed at the next poll — so the window is symmetric around the drop, not behind it.
 */
export const MATCH_WINDOW_TICKS = 40;

export interface Arrival {
  readonly slot: number;
  readonly tick: number;
}

/** The arrival closest to the drop inside the window; `undefined` when the drop stands alone. */
export function pairArrival(arrivals: readonly Arrival[], dropTick: number, window = MATCH_WINDOW_TICKS): Arrival | undefined {
  let best: Arrival | undefined;
  for (const arrival of arrivals) {
    if (Math.abs(dropTick - arrival.tick) > window) continue;
    if (best === undefined || Math.abs(dropTick - arrival.tick) < Math.abs(dropTick - best.tick)) best = arrival;
  }
  return best;
}

/**
 * The tier from what the generation cost (L0-xasm39): a table offer costs 1, 2 or 3 levels. A bigger drop is not a
 * table — an anvil combine costs up to 39 — and nothing is added for it.
 */
export function tierFromDrop(drop: number): Tier | undefined {
  return drop === 1 || drop === 2 || drop === 3 ? drop : undefined;
}

/**
 * The one enchantment option a′ may add: the roll's treasure, and only when the rare stage hit. Never an id the stack
 * already carries, at any level — raising a level means removing the level that was there, which a′ forbids.
 */
export function additionFor(roll: EnchantRoll, present: ReadonlySet<string>): RolledEnchantment | undefined {
  if (!roll.eligible || roll.rareStage !== "hit") return undefined;
  return roll.enchantments.find((e) => TREASURE.has(e.id) && !present.has(e.id));
}
