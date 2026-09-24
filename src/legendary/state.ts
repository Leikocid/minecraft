// Single owner of persistent legendary-item state: thin wrappers over the
// Script API. Key names come from registry.ts; the pure decisions these
// wrappers feed live in rules.ts.

import { type Container, type ItemStack, type Player, world } from "@minecraft/server";
import { type LegendaryDef, keysFor } from "./registry";
import { type Mark, type MarkOrigin, parseMark, serializeMark } from "./rules";

export function isItemOf(def: LegendaryDef, stack: ItemStack | undefined): stack is ItemStack {
  return stack?.typeId === def.itemId;
}

/** Reads the instance mark off a stack, or undefined if it carries none. */
export function getMark(def: LegendaryDef, stack: ItemStack): Mark | undefined {
  const keys = keysFor(def);
  const origin = stack.getDynamicProperty(keys.origin);
  const owner = stack.getDynamicProperty(keys.owner);
  const id = stack.getDynamicProperty(keys.id);
  if ((origin !== "craft" && origin !== "admin") || typeof owner !== "string" || typeof id !== "string") {
    return undefined;
  }

  const ownerName = stack.getDynamicProperty(keys.ownerName);
  return typeof ownerName === "string" ? { origin, owner, id, ownerName } : { origin, owner, id };
}

/** Clones `stack` and stamps it with `mark`. The input stack is untouched. */
export function markItem(def: LegendaryDef, stack: ItemStack, mark: Mark): ItemStack {
  const keys = keysFor(def);
  const marked = stack.clone();
  marked.setDynamicProperty(keys.origin, mark.origin);
  marked.setDynamicProperty(keys.owner, mark.owner);
  marked.setDynamicProperty(keys.id, mark.id);
  if (mark.ownerName !== undefined) {
    marked.setDynamicProperty(keys.ownerName, mark.ownerName);
  }
  return marked;
}

/**
 * Builds a fresh instance mark for `player`. `ownerName` is only populated
 * for `origin: "craft"` — it exists solely for the first-craft chat message.
 */
export function makeMark(origin: MarkOrigin, player: Player): Mark {
  const id = `${world.getAbsoluteTime()}-${Math.random().toString(36).slice(2)}`;
  return origin === "craft"
    ? { origin, owner: player.id, id, ownerName: player.name }
    : { origin, owner: player.id, id };
}

/** Whether the one-per-world survival craft of `def` has already succeeded. */
export function isCrafted(def: LegendaryDef): boolean {
  return world.getDynamicProperty(keysFor(def).crafted) === true;
}

export function setCrafted(def: LegendaryDef, byName: string): void {
  const keys = keysFor(def);
  world.setDynamicProperty(keys.crafted, true);
  world.setDynamicProperty(keys.craftedBy, byName);
}

/** Clears the craft flag. For the operator reset and GameTest world resets. */
export function resetCrafted(def: LegendaryDef): void {
  const keys = keysFor(def);
  world.setDynamicProperty(keys.crafted, false);
  world.setDynamicProperty(keys.craftedBy, undefined);
}

/** The mark awaiting return to `player` after death, if any. */
export function getPending(def: LegendaryDef, player: Player): Mark | undefined {
  const raw = player.getDynamicProperty(keysFor(def).pending);
  return typeof raw === "string" ? parseMark(raw) : undefined;
}

export function setPending(def: LegendaryDef, player: Player, mark: Mark): void {
  player.setDynamicProperty(keysFor(def).pending, serializeMark(mark));
}

export function clearPending(def: LegendaryDef, player: Player): void {
  player.setDynamicProperty(keysFor(def).pending, undefined);
}

export interface MarkedSlot {
  slot: number;
  stack: ItemStack;
  mark: Mark;
}

/** The first marked instance of `def` found in `container`, if any. */
export function findMarked(def: LegendaryDef, container: Container): MarkedSlot | undefined {
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (!isItemOf(def, stack)) {
      continue;
    }
    const mark = getMark(def, stack);
    if (mark === undefined) {
      continue;
    }
    return { slot, stack, mark };
  }
  return undefined;
}
