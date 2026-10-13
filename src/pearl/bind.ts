// The binding (spec v3 §7, unbound state; L0-pear-pr02): a hook cast from a Pearl Rod that comes to rest in a pressure
// plate's cell writes {dimension, plate cell, plate type, binder, life epoch, plate generation} onto that rod and is
// removed. The decisions are in bind-rules.ts; this module is the engine half — hooks in, rod writes out.

import { type Container, type Entity, type ItemStack, Player, system, world } from "@minecraft/server";
import {
  type Binding,
  BOUND_MESSAGE_KEY,
  HOOK_ID,
  type HitWatch,
  LIFE_EPOCH_KEY,
  NO_HIT,
  bindingEntries,
  boundLore,
  counterOf,
  generationKey,
  hookCell,
  hookVerdict,
  isConfirmed,
  nextHitWatch,
  readBinding,
  type Vec3,
} from "./bind-rules";
import { claimGeneration } from "./generation";
import { MARK_KEY } from "./item-rules";
import { isPearlRodStack } from "./item";

/** Counters a GameTest reads to tell what the module did. */
export const bindStats = { tracked: 0, binds: 0, entityHits: 0, rodMissing: 0, errors: 0 };

interface Tracked {
  hook: Entity;
  player: Player;
  rodId: string;
  inEntity: boolean;
  watch: HitWatch;
}

/** Live hooks cast from a Pearl Rod, by hook id. Runtime only: a restart drops them and the cast is a plain one. */
const tracked = new Map<string, Tracked>();

const inventoryOf = (player: Player): Container | undefined => player.getComponent("minecraft:inventory")?.container;

/** The rod `rodId` in `player`'s inventory, the selected slot first; undefined when it has left the inventory. */
function findRod(player: Player, rodId: string): { container: Container; slot: number; stack: ItemStack } | undefined {
  const container = inventoryOf(player);
  if (container === undefined) return undefined;
  const selected = player.selectedSlotIndex;
  const slots = [selected, ...Array.from({ length: container.size }, (_, i) => i).filter((i) => i !== selected)];
  for (const slot of slots) {
    const stack = container.getItem(slot);
    if (isPearlRodStack(stack) && stack?.getDynamicProperty(MARK_KEY) === rodId) return { container, slot, stack };
  }
  return undefined;
}

/** The binding a stack carries; undefined for an unbound rod and for anything that is not a Pearl Rod. */
export function bindingOf(stack: ItemStack | undefined): Binding | undefined {
  if (stack === undefined || !isPearlRodStack(stack)) return undefined;
  return readBinding((key) => stack.getDynamicProperty(key));
}

export function lifeEpochOf(player: Player): number {
  return counterOf(player.getDynamicProperty(LIFE_EPOCH_KEY));
}

export function plateGeneration(dim: string, cell: Vec3): number {
  return counterOf(world.getDynamicProperty(generationKey(dim, cell)));
}

/** Writes the record onto the rod and puts the stack back; false when the rod is no longer in the inventory. */
function bind(t: Tracked, cell: Vec3, plateType: string): boolean {
  const found = findRod(t.player, t.rodId);
  if (found === undefined) {
    bindStats.rodMissing++;
    return false;
  }
  const dim = t.hook.dimension.id;
  const { container, slot, stack } = found;
  const record: Binding = {
    dim,
    pos: cell,
    type: plateType,
    owner: t.player.id,
    epoch: lifeEpochOf(t.player),
    gen: claimGeneration(dim, cell, t.rodId, t.player.id, bindingOf(stack)),
  };
  for (const [key, value] of bindingEntries(record)) stack.setDynamicProperty(key, value);
  stack.setLore(boundLore(record));
  const durability = stack.getComponent("minecraft:durability");
  if (durability !== undefined && durability.damage > 0) durability.damage = 0;
  container.setItem(slot, stack);
  // setItem while the hook is out keeps the hook (probe Q7), so it is removed here; a removed hook leaves no cast
  // behind, and the next use casts afresh (probe Q4).
  t.hook.remove();
  t.player.onScreenDisplay.setActionBar({ translate: BOUND_MESSAGE_KEY });
  bindStats.binds++;
  return true;
}

function check(id: string, t: Tracked): void {
  if (!t.hook.isValid || !t.player.isValid) {
    tracked.delete(id);
    return;
  }
  const location = t.hook.location;
  const cell = hookCell(location);
  // getBlock returns undefined for an unloaded cell and throws outside the dimension's height range.
  let cellType: string | undefined;
  try {
    cellType = t.hook.dimension.getBlock(cell)?.typeId;
  } catch {
    cellType = undefined;
  }
  const verdict = hookVerdict({ location, velocity: t.hook.getVelocity(), onGround: t.hook.isOnGround, inEntity: t.inEntity }, cellType);
  t.watch = nextHitWatch(t.watch, verdict, cell);
  if (!isConfirmed(t.watch) || cellType === undefined) return;
  tracked.delete(id);
  bind(t, cell, cellType);
}

function checkAll(): void {
  if (tracked.size === 0) return;
  for (const [id, t] of [...tracked]) {
    try {
      check(id, t);
    } catch (err) {
      tracked.delete(id);
      bindStats.errors++;
      const why = err instanceof Error ? err.message : String(err);
      console.warn(`[andrew] pearl rod: the hook check failed: ${why}`);
    }
  }
}

let armed = false;

/** Arms the binding once per pack: a second set of subscriptions would run the check twice a tick. */
export function registerPearlBind(): void {
  if (armed) return;
  armed = true;
  world.afterEvents.entitySpawn.subscribe((event) => {
    const hook = event.entity;
    if (hook.typeId !== HOOK_ID || !hook.isValid) return;
    // The owner is readable already at spawn +0 and names the caster on every hook (probe Q3).
    const owner = hook.getComponent("minecraft:projectile")?.owner;
    if (!(owner instanceof Player) || !owner.isValid) return;
    const rod = inventoryOf(owner)?.getItem(owner.selectedSlotIndex);
    if (!isPearlRodStack(rod)) return;
    const rodId = rod?.getDynamicProperty(MARK_KEY);
    if (typeof rodId !== "string") return;
    tracked.set(hook.id, { hook, player: owner, rodId, inEntity: false, watch: NO_HIT });
    bindStats.tracked++;
  });

  world.afterEvents.projectileHitEntity.subscribe((event) => {
    const t = tracked.get(event.projectile.id);
    if (t === undefined) return;
    t.inEntity = true;
    bindStats.entityHits++;
  });

  system.runInterval(checkAll, 1);
  console.warn("[andrew] pearl rod binding armed");
}
