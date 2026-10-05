// Single owner of persistent legendary-item state: thin wrappers over the
// Script API. Key names come from registry.ts; the pure decisions these
// wrappers feed live in rules.ts.

import {
  type Container,
  EntityComponentTypes,
  EquipmentSlot,
  type ItemStack,
  type Player,
  world,
} from "@minecraft/server";
import { type LegendaryDef, genLedgerKey, keysFor } from "./registry";
import {
  type Mark,
  type MarkOrigin,
  type OwedLedger,
  isGen,
  isHolder,
  parseOwed,
  parsePending,
  serializeOwed,
  serializePending,
  withPending,
} from "./rules";

export function isItemOf(def: LegendaryDef, stack: ItemStack | undefined): stack is ItemStack {
  return stack?.typeId === def.itemId;
}

/** Reads the instance mark off a stack, or undefined if it carries none. */
export function getMark(def: LegendaryDef, stack: ItemStack): Mark | undefined {
  const keys = keysFor(def);
  const origin = stack.getDynamicProperty(keys.origin);
  const owner = stack.getDynamicProperty(keys.owner);
  const id = stack.getDynamicProperty(keys.id);
  const gen = stack.getDynamicProperty(keys.gen) ?? 0;
  if ((origin !== "craft" && origin !== "admin") || typeof owner !== "string" || typeof id !== "string" || !isGen(gen)) {
    return undefined;
  }

  const mark: Mark = { origin, owner, id, gen };
  const ownerName = stack.getDynamicProperty(keys.ownerName);
  if (typeof ownerName === "string") {
    mark.ownerName = ownerName;
  }
  const holder = stack.getDynamicProperty(keys.holder);
  if (isHolder(holder)) {
    mark.holder = holder;
    const holderName = stack.getDynamicProperty(keys.holderName);
    if (typeof holderName === "string") {
      mark.holderName = holderName;
    }
  }
  return mark;
}

/** Clones `stack` and stamps it with `mark`. The input stack is untouched. */
export function markItem(def: LegendaryDef, stack: ItemStack, mark: Mark): ItemStack {
  const keys = keysFor(def);
  const marked = stack.clone();
  marked.setDynamicProperty(keys.origin, mark.origin);
  marked.setDynamicProperty(keys.owner, mark.owner);
  marked.setDynamicProperty(keys.id, mark.id);
  marked.setDynamicProperty(keys.gen, mark.gen);
  if (mark.ownerName !== undefined) {
    marked.setDynamicProperty(keys.ownerName, mark.ownerName);
  }
  if (mark.holder !== undefined) {
    marked.setDynamicProperty(keys.holder, mark.holder);
    if (mark.holderName !== undefined) {
      marked.setDynamicProperty(keys.holderName, mark.holderName);
    }
  }
  return marked;
}

/**
 * Records `player` as the holder of the marked stack in `slot`, in place: the
 * stack keeps its state and stays where it is. A slot write can raise another
 * playerInventoryItemChange, so callers write only when the holder differs.
 */
export function stampHolder(def: LegendaryDef, container: Container, slot: number, player: Player): void {
  const keys = keysFor(def);
  container.getSlot(slot).setDynamicProperties({ [keys.holder]: player.id, [keys.holderName]: player.name });
}

/**
 * Builds a fresh instance mark for `player`, who is both its owner and its
 * holder. `ownerName` is only populated for `origin: "craft"` — it exists
 * solely for the first-craft chat message.
 */
export function makeMark(origin: MarkOrigin, player: Player): Mark {
  const id = `${world.getAbsoluteTime()}-${Math.random().toString(36).slice(2)}`;
  const holder = { holder: player.id, holderName: player.name };
  return origin === "craft"
    ? { origin, owner: player.id, id, gen: 0, ownerName: player.name, ...holder }
    : { origin, owner: player.id, id, gen: 0, ...holder };
}

/** The live generation of instance `id` in the world ledger. */
export function ledgerGen(def: LegendaryDef, id: string): number {
  const raw = world.getDynamicProperty(genLedgerKey(def, id));
  return isGen(raw) ? raw : 0;
}

/**
 * Moves instance `id` one generation on and returns the new one: every stack
 * stamped with an older generation is stale from here on (R-lgnd-005).
 */
export function bumpGen(def: LegendaryDef, id: string): number {
  const gen = ledgerGen(def, id) + 1;
  world.setDynamicProperty(genLedgerKey(def, id), gen);
  return gen;
}

/** Whether `mark` names the instance's live generation. */
export function isLive(def: LegendaryDef, mark: Mark): boolean {
  return mark.gen === ledgerGen(def, mark.id);
}

/** A marked stack of `def` whose generation has been superseded. Unmarked stacks are never stale. */
export function isStale(def: LegendaryDef, stack: ItemStack): boolean {
  const mark = getMark(def, stack);
  return mark !== undefined && !isLive(def, mark);
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

/** The marks awaiting return to `player` after death, oldest first. */
export function readPending(def: LegendaryDef, player: Player): Mark[] {
  return parsePending(player.getDynamicProperty(keysFor(def).pending));
}

export function writePending(def: LegendaryDef, player: Player, marks: readonly Mark[]): void {
  player.setDynamicProperty(keysFor(def).pending, marks.length > 0 ? serializePending(marks) : undefined);
}

/** Appends `marks` to `player`'s pending list, one entry per instance. */
export function addPending(def: LegendaryDef, player: Player, marks: readonly Mark[]): void {
  writePending(def, player, marks.reduce<Mark[]>(withPending, readPending(def, player)));
}

/** Instances lost while their return target could not take them, by target id. */
export function readOwed(def: LegendaryDef): OwedLedger {
  return parseOwed(world.getDynamicProperty(keysFor(def).owed));
}

export function writeOwed(def: LegendaryDef, owed: OwedLedger): void {
  world.setDynamicProperty(keysFor(def).owed, Object.keys(owed).length > 0 ? serializeOwed(owed) : undefined);
}

export interface MarkedSlot {
  slot: number;
  stack: ItemStack;
  mark: Mark;
}

/** Every marked instance of `def` in `container`, in slot order. */
export function findAllMarked(def: LegendaryDef, container: Container): MarkedSlot[] {
  const found: MarkedSlot[] = [];
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (!isItemOf(def, stack)) {
      continue;
    }
    const mark = getMark(def, stack);
    if (mark !== undefined) {
      found.push({ slot, stack, mark });
    }
  }
  return found;
}

/** The first marked instance of `def` found in `container`, if any. */
export function findMarked(def: LegendaryDef, container: Container): MarkedSlot | undefined {
  return findAllMarked(def, container)[0];
}

/** The player's off-hand stack. `minecraft:inventory` does not include the off hand. */
export function offhandOf(player: Player): ItemStack | undefined {
  return player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Offhand);
}

/**
 * Writes the off hand, or throws. The engine refuses a custom item without
 * `minecraft:allow_off_hand` by returning false, not by throwing.
 */
export function setOffhand(player: Player, stack: ItemStack | undefined): void {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (equippable === undefined || !equippable.setEquipment(EquipmentSlot.Offhand, stack)) {
    throw new Error(`${player.name}'s off hand refused ${stack?.typeId ?? "to be emptied"}`);
  }
}

function isInstance(def: LegendaryDef, stack: ItemStack | undefined, mark: Mark): boolean {
  if (!isItemOf(def, stack)) {
    return false;
  }
  const held = getMark(def, stack);
  return held?.id === mark.id && held.gen === mark.gen;
}

/** Whether `player` already holds this instance at this generation, in `container` or the off hand. */
export function carriesInstance(def: LegendaryDef, player: Player, container: Container, mark: Mark): boolean {
  for (let slot = 0; slot < container.size; slot++) {
    if (isInstance(def, container.getItem(slot), mark)) {
      return true;
    }
  }
  return isInstance(def, offhandOf(player), mark);
}

/** Empties every slot of `container` holding a stale stack of `def`; returns how many. */
export function voidStale(def: LegendaryDef, container: Container): number {
  let voided = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const stack = container.getItem(slot);
    if (isItemOf(def, stack) && isStale(def, stack)) {
      container.setItem(slot, undefined);
      voided++;
    }
  }
  return voided;
}
