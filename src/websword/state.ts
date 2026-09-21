// Single owner of all persistent Web Sword state: identifiers, dynamic
// property keys, and thin wrappers over the Script API. No game logic lives
// here — see rules.ts for the pure decisions (craftDecision,
// cooldownRemaining, parseMark/serializeMark) that these wrappers feed.
//
// Every other task in the epic (craft gate, retention, cooldown UI, trap)
// reads and writes state exclusively through this module — the
// `andrew:ws_*` dynamic property keys below must not appear anywhere else in
// the repository.

import { type Container, type ItemStack, type Player, world } from "@minecraft/server";
import { type Mark, type MarkOrigin, parseMark, serializeMark } from "./rules";

export const WEB_SWORD_ID = "andrew:web_sword";

// Instance mark — dynamic properties on the ItemStack (Q-006).
const DP_ORIGIN = "andrew:ws_origin";
const DP_OWNER = "andrew:ws_owner";
const DP_ID = "andrew:ws_id";
const DP_OWNER_NAME = "andrew:ws_owner_name";

// World flag — one successful survival craft, ever (spec §3).
const DP_CRAFTED = "andrew:ws_crafted";
const DP_CRAFTED_BY = "andrew:ws_crafted_by";

// Pending return on death — player-scoped (spec §4).
const DP_PENDING = "andrew:ws_pending";

// Cooldown — player-scoped, persisted as an absolute world tick (Q-009).
const DP_COOLDOWN_UNTIL = "andrew:ws_cooldown_until";

export function isWebSword(stack: ItemStack | undefined): stack is ItemStack {
  return stack?.typeId === WEB_SWORD_ID;
}

/** Reads the instance mark off a stack, or undefined if it carries none. */
export function getMark(stack: ItemStack): Mark | undefined {
  const origin = stack.getDynamicProperty(DP_ORIGIN);
  const owner = stack.getDynamicProperty(DP_OWNER);
  const id = stack.getDynamicProperty(DP_ID);
  if ((origin !== "craft" && origin !== "admin") || typeof owner !== "string" || typeof id !== "string") {
    return undefined;
  }

  const ownerName = stack.getDynamicProperty(DP_OWNER_NAME);
  return typeof ownerName === "string" ? { origin, owner, id, ownerName } : { origin, owner, id };
}

/** Clones `stack` and stamps it with `mark`. The input stack is untouched. */
export function markSword(stack: ItemStack, mark: Mark): ItemStack {
  const marked = stack.clone();
  marked.setDynamicProperty(DP_ORIGIN, mark.origin);
  marked.setDynamicProperty(DP_OWNER, mark.owner);
  marked.setDynamicProperty(DP_ID, mark.id);
  if (mark.ownerName !== undefined) {
    marked.setDynamicProperty(DP_OWNER_NAME, mark.ownerName);
  }
  return marked;
}

/**
 * Builds a fresh instance mark for `player`. `ownerName` is only populated
 * for `origin: "craft"` — it exists solely for the first-craft chat message
 * (spec §3), and admin-issued copies have no need of it.
 */
export function makeMark(origin: MarkOrigin, player: Player): Mark {
  const id = `${world.getAbsoluteTime()}-${Math.random().toString(36).slice(2)}`;
  return origin === "craft"
    ? { origin, owner: player.id, id, ownerName: player.name }
    : { origin, owner: player.id, id };
}

/** Whether the one-per-world survival craft has already succeeded. */
export function isCrafted(): boolean {
  return world.getDynamicProperty(DP_CRAFTED) === true;
}

/** Claims the one-per-world craft flag, recording the crafter's name. */
export function setCrafted(byName: string): void {
  world.setDynamicProperty(DP_CRAFTED, true);
  world.setDynamicProperty(DP_CRAFTED_BY, byName);
}

/** Clears the craft flag. For test/GameTest world resets only. */
export function resetCrafted(): void {
  world.setDynamicProperty(DP_CRAFTED, false);
  world.setDynamicProperty(DP_CRAFTED_BY, undefined);
}

/** The mark awaiting return to `player` after death, if any. */
export function getPending(player: Player): Mark | undefined {
  const raw = player.getDynamicProperty(DP_PENDING);
  return typeof raw === "string" ? parseMark(raw) : undefined;
}

/** Records `mark` as owed back to `player` — set on death. */
export function setPending(player: Player, mark: Mark): void {
  player.setDynamicProperty(DP_PENDING, serializeMark(mark));
}

/** Clears the pending return for `player` — set once the sword is back. */
export function clearPending(player: Player): void {
  player.setDynamicProperty(DP_PENDING, undefined);
}

/** The world tick at which `player`'s cooldown ends, or 0 if none is set. */
export function getCooldownUntil(player: Player): number {
  const raw = player.getDynamicProperty(DP_COOLDOWN_UNTIL);
  return typeof raw === "number" ? raw : 0;
}

/** Persists the world tick at which `player`'s cooldown ends. */
export function setCooldownUntil(player: Player, tick: number): void {
  player.setDynamicProperty(DP_COOLDOWN_UNTIL, tick);
}

export interface MarkedSlot {
  slot: number;
  stack: ItemStack;
  mark: Mark;
}

/** The first marked Web Sword found in `container`, if any. */
export function findMarkedSword(container: Container): MarkedSlot | undefined {
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (!isWebSword(stack)) {
      continue;
    }
    const mark = getMark(stack);
    if (mark === undefined) {
      continue;
    }
    return { slot, stack, mark };
  }
  return undefined;
}
