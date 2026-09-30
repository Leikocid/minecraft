// Activation of the Orbital Cannon (L0-orbc-p001): input → hand → dedup →
// cooldown → target → lock → commit. The input set is the one measured on BDS
// 1.26.51.1 (docs/feedback/diagnose-CNTR-XCX14-AA.md), not the one in
// L0-adr-orbc §2 — see README.md, deviation 2.

import {
  type Block,
  type Direction,
  type Entity,
  EntitySwingSource,
  EquipmentSlot,
  type ItemStack,
  Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { isReady, startCooldown } from "../legendary/cooldown";
import { resolveActivation } from "../legendary/hands";
import { ORBITAL_CANNON, defForStack } from "../legendary/registry";
import { type Effect, type Mode, effectFor, isContact } from "./charge";
import { spawnCharge, spawnY } from "./spawn";
import { type TargetLock, lockTarget } from "./target";

export interface Charge {
  entity: Entity;
  /** Index in the effect's layout. */
  slot: number;
  x: number;
  z: number;
  /** Feet Y. */
  y: number;
}

/** L0-orbc-ent2. In memory only; nothing here is persisted. */
export interface Attack {
  attackId: string;
  mode: Mode;
  ownerId: string;
  dimensionId: string;
  target: Vector3;
  face: Direction | undefined;
  spawnY: number;
  charges: Charge[];
  createdTick: number;
}

export type AttackObserver = (attack: Attack) => void;

const attacks = new Map<string, Attack>();
const lastActivationTick = new Map<string, number>();
const observers = new Set<AttackObserver>();
let attackSeq = 0;

const log = (msg: string): void => console.warn(`[andrew] orbital: ${msg}`);
const at = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

/** Attacks with at least one charge still in the world. */
export function activeAttacks(): ReadonlyMap<string, Attack> {
  return attacks;
}

/**
 * Calls `observer` with every committed attack, in its activation tick, after
 * all its charges exist and before any of them detonates. Returns the unsubscribe.
 */
export function observeAttacks(observer: AttackObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

/** Removes the attack and every charge it still holds. There is no path back to the cooldown (C-17). */
export function endAttack(attackId: string): void {
  const attack = attacks.get(attackId);
  attacks.delete(attackId);
  removeAll(attack?.charges ?? []);
}

function removeAll(charges: Charge[]): void {
  for (const charge of charges) {
    try {
      if (charge.entity.isValid) charge.entity.remove();
    } catch (err) {
      log(`could not remove a charge: ${String(err)}`);
    }
  }
}

/** r008 at spawn: a charge whose cell is a contact block goes off there, in this tick, and never falls. */
function detonateInsideSolid(attack: Attack, effect: Effect, lock: TargetLock): void {
  const dim = lock.block.dimension;
  const falling: Charge[] = [];
  for (const charge of attack.charges) {
    const cell = dim.getBlock({ x: charge.x, y: charge.y, z: charge.z });
    if (cell === undefined || !isContact(cell)) {
      falling.push(charge);
      continue;
    }
    const point = { x: cell.x, y: cell.y, z: cell.z };
    try {
      effect.onDetonate(dim, point, attack.ownerId, attack.mode, attack.attackId);
    } catch (err) {
      log(`attack ${attack.attackId}: onDetonate at ${at(point)} threw ${String(err)}`);
    }
    removeAll([charge]);
  }
  attack.charges = falling;
}

interface Owner {
  id: string;
  name: string;
}

/**
 * Step 7: cooldown, dedup tick, spawn height, columns, charges, registration —
 * all in this tick. The player is touched here for the cooldown write only.
 */
function commit(player: Player, owner: Owner, mode: Mode, effect: Effect, lock: TargetLock, tick: number): Attack | undefined {
  startCooldown(player, ORBITAL_CANNON.abilityKey);
  lastActivationTick.set(owner.id, tick);
  const attack: Attack = {
    attackId: `oc-${tick}-${++attackSeq}`,
    mode,
    ownerId: owner.id,
    dimensionId: lock.dimensionId,
    target: lock.location,
    face: lock.face,
    spawnY: 0,
    charges: [],
    createdTick: tick,
  };

  const dim = lock.block.dimension;
  try {
    attack.spawnY = spawnY(dim.id, lock.location.y, dim.heightRange);
    effect.layout(lock.location).forEach((column, slot) => {
      const entity = spawnCharge(dim, column, attack.spawnY, attack.attackId, effect.scale);
      attack.charges.push({ entity, slot, x: column.x, z: column.z, y: attack.spawnY });
    });
  } catch (err) {
    // p001 step 8: the cooldown stays, and no half-spawned attack is left.
    removeAll(attack.charges);
    log(`attack ${attack.attackId} by ${owner.name} failed to spawn, cooldown kept: ${String(err)}`);
    return undefined;
  }

  for (const observer of observers) {
    try {
      observer(attack);
    } catch (err) {
      log(`attack observer threw ${String(err)}`);
    }
  }
  const spawned = attack.charges.length;
  detonateInsideSolid(attack, effect, lock);
  if (attack.charges.length > 0) attacks.set(attack.attackId, attack);
  log(
    `${owner.name} fired ${mode} at ${at(lock.location)} in ${lock.dimensionId}: attack ${attack.attackId}, ` +
      `${spawned} charge(s) at y=${attack.spawnY}, ${spawned - attack.charges.length} inside a solid block`
  );
  return attack;
}

/**
 * One input event, already mapped to its mode. Returns the attack it
 * committed, or undefined for every silent refusal (L0-orbc-as06, -r004).
 */
export function activate(player: Player, mode: Mode, eventBlock?: Block, eventFace?: Direction): Attack | undefined {
  const resolved = resolveActivation(player);
  if (resolved?.def.itemId !== ORBITAL_CANNON.itemId) return undefined;
  // An attack is a main-hand action: an off-hand Cannon answers Use only (L0-lgnd-as14).
  if (mode === "lmb" && resolved.slot !== EquipmentSlot.Mainhand) return undefined;

  const tick = system.currentTick;
  if (lastActivationTick.get(player.id) === tick) return undefined;
  if (!isReady(player, ORBITAL_CANNON.abilityKey)) return undefined;

  const effect = effectFor(mode);
  if (effect === undefined) {
    log(`no effect registered for ${mode}; nothing fired`);
    return undefined;
  }
  const owner: Owner = { id: player.id, name: player.name };
  // No block: no cooldown, and the dedup tick stays free (r004).
  const lock = lockTarget(player, eventBlock, eventFace);
  return lock === undefined ? undefined : commit(player, owner, mode, effect, lock, tick);
}

const isLegendary = (stack: ItemStack | undefined): boolean => defForStack(stack) !== undefined;
const isCannon = (stack: ItemStack | undefined): boolean => stack?.typeId === ORBITAL_CANNON.itemId;

export function registerOrbitalInput(): void {
  // Handlers type the player as possibly undefined: a SimulatedPlayer reaches
  // a pack without @minecraft/server-gametest as undefined.
  world.afterEvents.itemUse.subscribe((event) => {
    const player: Player | undefined = event.source;
    if (player !== undefined && isLegendary(event.itemStack)) activate(player, "rmb");
  });

  // A use on a block raises neither itemUse nor after.playerInteractWithBlock
  // for this item — only itemStartUseOn carries it.
  world.afterEvents.itemStartUseOn.subscribe((event) => {
    const player: Player | undefined = event.source;
    if (player !== undefined && isLegendary(event.itemStack)) activate(player, "rmb", event.block, event.blockFace);
  });

  world.afterEvents.entityHitBlock.subscribe((event) => {
    const player = event.damagingEntity;
    if (player instanceof Player) activate(player, "lmb", event.hitBlock, event.blockFace);
  });

  // The only LMB signal for a swing that hits no block, at any distance or at
  // the sky; entityHitBlock never comes with it.
  world.afterEvents.playerSwingStart.subscribe((event) => {
    const player: Player | undefined = event.player;
    if (player !== undefined && event.swingSource === EntitySwingSource.Attack && isCannon(event.heldItemStack)) {
      activate(player, "lmb");
    }
  });

  // Load-bearing, not cosmetic: in Creative the break runs before
  // entityHitBlock, which would otherwise find the target already air (L0-orbc-as05).
  world.beforeEvents.playerBreakBlock.subscribe((event) => {
    if (isCannon(event.itemStack)) event.cancel = true;
  });

  world.afterEvents.playerLeave.subscribe((event) => {
    lastActivationTick.delete(event.playerId);
  });
}
