// The fall of every live charge (L0-orbc-p002, L0-orbc-ad02) and the life
// of the attacks that hold them (L0-orbc-p003, L0-orbc-ad03): one shared
// interval while any attack has a charge, five ways for a charge to end (the
// fifth, "intercepted", only through a registered interceptor: L0-adr-ufoi),
// and the sweeps that remove charge entities no live attack owns.
//
// Nothing here listens to the owner: no entityDie, playerLeave,
// playerDimensionChange or hand change (L0-orbc-r010). The owner is the
// string `ownerId` handed to the effect.

import { type Dimension, type Direction, type Entity, LocationInUnloadedChunkError, type Vector3, system, world } from "@minecraft/server";
import { CHARGE_ENTITY_ID, type CellRead, type Mode, attackIdOfTag, effectFor, fallStep, isContact, scopeOfAttack } from "./charge";
import { chargeLocation } from "./spawn";

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
  /** The owner's name at the shot: what the UFO broadcast names once the owner has left (L0-sauc-as03). */
  ownerName?: string;
}

export type Outcome = "detonated" | "voided" | "lost" | "timeout" | "intercepted";

export interface ChargeEnd {
  attack: Attack;
  charge: Charge;
  outcome: Outcome;
  /** The contact cell, for a detonation. */
  point: Vector3 | undefined;
  tick: number;
}

export type ChargeEndObserver = (end: ChargeEnd) => void;

/**
 * Sees the segment one charge sweeps in one step, `from` (its feet now) down to
 * `to`, before the charge moves or detonates. `true` ends the charge as
 * "intercepted": removed, no effect (L0-adr-ufoi, L0-sauc-p003).
 */
export type Interceptor = (attack: Attack, charge: Charge, from: Vector3, to: Vector3, tick: number) => boolean;

/** A guard against a stuck path, not a feature (L0-orbc-p002 "Termination"). */
export const ATTACK_TIMEOUT_TICKS = 400;

export const DEFAULT_SCOPE = "oc";

const DIMENSIONS = ["overworld", "nether", "the_end"];

const attacks = new Map<string, Attack>();
/** Entity ids of every charge a live attack holds: the one test of "live" for the sweeps. */
const tracked = new Set<string>();
const endObservers = new Set<ChargeEndObserver>();
const interceptors = new Set<Interceptor>();
/** Attacks an interceptor already threw on: one log line each, not one per charge step. */
const interceptorThrew = new WeakSet<Attack>();
const loop = { handle: undefined as number | undefined, starts: 0, stops: 0, steps: 0, ms: 0 };
const orphans = { startup: 0, load: 0, spawn: 0 };
const pendingOrphanLog = { load: 0, spawn: 0, scheduled: false };
let scope = DEFAULT_SCOPE;
let attackSeq = 0;

const log = (msg: string): void => console.warn(`[andrew] orbital: ${msg}`);

export function newAttackId(tick: number): string {
  return `${scope}-${tick}-${++attackSeq}`;
}

/** Attacks with at least one charge still in the world. */
export function activeAttacks(): ReadonlyMap<string, Attack> {
  return attacks;
}

export interface FlightLoop {
  running: boolean;
  starts: number;
  stops: number;
  steps: number;
  /** Wall-clock milliseconds spent inside the steps, summed. */
  ms: number;
}

/** Whether the shared interval exists, how often it was started and cleared, and what its steps cost. */
export function flightLoop(): FlightLoop {
  return { running: loop.handle !== undefined, starts: loop.starts, stops: loop.stops, steps: loop.steps, ms: loop.ms };
}

/** Charge entities removed as orphans by this runtime, per sweep. */
export function orphanCounts(): Readonly<typeof orphans> {
  return orphans;
}

/** Calls `observer` once per charge as it ends, after its entity is removed. Returns the unsubscribe. */
export function observeChargeEnds(observer: ChargeEndObserver): () => void {
  endObservers.add(observer);
  return () => endObservers.delete(observer);
}

/** Returns the unregister. */
export function registerInterceptor(interceptor: Interceptor): () => void {
  interceptors.add(interceptor);
  return () => {
    interceptors.delete(interceptor);
  };
}

export function interceptorCount(): number {
  return interceptors.size;
}

export function removeCharges(charges: Charge[]): void {
  for (const charge of charges) {
    tracked.delete(charge.entity.id);
    try {
      if (charge.entity.isValid) charge.entity.remove();
    } catch (err) {
      log(`could not remove a charge: ${String(err)}`);
    }
  }
}

/** Registers an attack that still has charges in the air, and starts the interval if none runs. */
export function launch(attack: Attack): void {
  if (attack.charges.length === 0) return;
  attacks.set(attack.attackId, attack);
  for (const charge of attack.charges) tracked.add(charge.entity.id);
  if (loop.handle === undefined) {
    loop.handle = system.runInterval(step, 1);
    loop.starts++;
  }
}

/** Removes the attack and every charge it still holds. There is no path back to the cooldown (C-17). */
export function endAttack(attackId: string): void {
  const attack = attacks.get(attackId);
  attacks.delete(attackId);
  removeCharges(attack?.charges ?? []);
  if (attack !== undefined) attack.charges = [];
  stopIfIdle();
}

function stopIfIdle(): void {
  if (attacks.size > 0 || loop.handle === undefined) return;
  system.clearRun(loop.handle);
  loop.handle = undefined;
  loop.stops++;
}

function finish(attack: Attack, charge: Charge, outcome: Outcome, tick: number, point?: Vector3): void {
  removeCharges([charge]);
  for (const observer of endObservers) {
    try {
      observer({ attack, charge, outcome, point, tick });
    } catch (err) {
      log(`charge observer threw ${String(err)}`);
    }
  }
}

function readCell(dim: Dimension, x: number, y: number, z: number): CellRead {
  let block;
  try {
    block = dim.getBlock({ x, y, z });
  } catch (err) {
    if (err instanceof LocationInUnloadedChunkError) return "unloaded";
    throw err;
  }
  if (block === undefined) return "unloaded";
  return isContact(block) ? "contact" : "clear";
}

function detonate(attack: Attack, dim: Dimension, point: Vector3): void {
  const effect = effectFor(attack.mode);
  if (effect === undefined) {
    log(`attack ${attack.attackId}: no ${attack.mode} effect registered at detonation`);
    return;
  }
  try {
    effect.onDetonate(dim, point, attack.ownerId, attack.mode, attack.attackId);
  } catch (err) {
    log(`attack ${attack.attackId}: onDetonate at ${point.x},${point.y},${point.z} threw ${String(err)}`);
  }
}

interface End {
  outcome: Outcome;
  point?: Vector3;
}

/** Whether an interceptor takes the charge on its way down to `toY`. One that throws counts as false and the charge flies on. */
function intercepted(attack: Attack, charge: Charge, toY: number, tick: number): boolean {
  if (interceptors.size === 0) return false;
  const from = chargeLocation(charge, charge.y);
  const to = chargeLocation(charge, toY);
  for (const interceptor of [...interceptors]) {
    try {
      if (interceptor(attack, charge, from, to, tick) === true) return true;
    } catch (err) {
      if (!interceptorThrew.has(attack)) {
        interceptorThrew.add(attack);
        log(`attack ${attack.attackId}: an interceptor threw at y=${charge.y} ${String(err)}; its charges fly on`);
      }
    }
  }
  return false;
}

/** One tick of one charge; undefined while it still falls. Entities are never consulted, so nothing but a block or an interceptor stops it. */
function advance(attack: Attack, charge: Charge, dim: Dimension, minY: number, tick: number): End | undefined {
  if (!charge.entity.isValid) return { outcome: "lost" };
  const next = fallStep(charge.y, minY, (cellY) => readCell(dim, charge.x, cellY, charge.z));
  if (next.kind === "move") {
    if (intercepted(attack, charge, next.y, tick)) return { outcome: "intercepted" };
    charge.entity.teleport(chargeLocation(charge, next.y));
    charge.y = next.y;
    return undefined;
  }
  if (next.kind === "contact") {
    // The last stretch, down to the top of the contact block, is offered too: a hull just above the ground still wins.
    if (intercepted(attack, charge, next.cellY + 1, tick)) return { outcome: "intercepted" };
    const point = { x: charge.x, y: next.cellY, z: charge.z };
    detonate(attack, dim, point);
    return { outcome: "detonated", point };
  }
  if (next.kind === "void") return intercepted(attack, charge, minY, tick) ? { outcome: "intercepted" } : { outcome: "voided" };
  return { outcome: "lost" };
}

function advanceAttack(attack: Attack, tick: number): void {
  if (tick - attack.createdTick >= ATTACK_TIMEOUT_TICKS) {
    log(`attack ${attack.attackId}: ${attack.charges.length} charge(s) still falling ${ATTACK_TIMEOUT_TICKS} ticks after firing, dropped as lost`);
    const left = attack.charges;
    attack.charges = [];
    for (const charge of left) finish(attack, charge, "timeout", tick);
    return;
  }
  const dim = world.getDimension(attack.dimensionId);
  const minY = dim.heightRange.min;
  const falling: Charge[] = [];
  for (const charge of attack.charges) {
    let end: End | undefined;
    try {
      end = advance(attack, charge, dim, minY, tick);
    } catch (err) {
      log(`attack ${attack.attackId}: charge ${charge.slot} at y=${charge.y} threw ${String(err)}, dropped as lost`);
      end = { outcome: "lost" };
    }
    if (end === undefined) falling.push(charge);
    else finish(attack, charge, end.outcome, tick, end.point);
  }
  attack.charges = falling;
}

function step(): void {
  const started = Date.now();
  const tick = system.currentTick;
  for (const attack of [...attacks.values()]) {
    try {
      advanceAttack(attack, tick);
    } catch (err) {
      log(`attack ${attack.attackId}: step threw ${String(err)}`);
    }
    if (attack.charges.length === 0) attacks.delete(attack.attackId);
  }
  loop.steps++;
  loop.ms += Date.now() - started;
  stopIfIdle();
}

function flushOrphanLog(): void {
  pendingOrphanLog.scheduled = false;
  log(`orphan charge(s) removed: ${pendingOrphanLog.load} on load, ${pendingOrphanLog.spawn} on spawn (tick ${system.currentTick})`);
  pendingOrphanLog.load = 0;
  pendingOrphanLog.spawn = 0;
}

/**
 * Removes `entity` when it is a charge no live attack of this runtime holds
 * (L0-orbc-p003 step 3). A charge of another scope belongs to another script
 * runtime sharing the world, and is left to it.
 */
function sweepIfOrphan(entity: Entity, via: "load" | "spawn"): void {
  if (!entity.isValid || entity.typeId !== CHARGE_ENTITY_ID || tracked.has(entity.id)) return;
  const attackId = entity.getTags().map(attackIdOfTag).find((id) => id !== undefined);
  if (attackId !== undefined && scopeOfAttack(attackId) !== scope) return;
  entity.remove();
  orphans[via]++;
  pendingOrphanLog[via]++;
  if (!pendingOrphanLog.scheduled) {
    pendingOrphanLog.scheduled = true;
    system.run(flushOrphanLog);
  }
}

/** After a (re)start no attack is live in any runtime, so every charge entity is stale. */
function sweepAll(): void {
  let removed = 0;
  for (const id of DIMENSIONS) {
    for (const entity of world.getDimension(id).getEntities({ type: CHARGE_ENTITY_ID })) {
      try {
        entity.remove();
        removed++;
      } catch (err) {
        log(`startup sweep could not remove a charge in ${id}: ${String(err)}`);
      }
    }
  }
  orphans.startup += removed;
  log(`startup sweep: ${removed} stale charge(s) removed (tick ${system.currentTick})`);
}

/**
 * Arms the orphan sweeps. `runtimeScope` prefixes this runtime's attack ids;
 * each script runtime in a world needs its own.
 */
export function registerFlight(runtimeScope: string = DEFAULT_SCOPE): void {
  scope = runtimeScope;
  world.afterEvents.entityLoad.subscribe((event) => sweepIfOrphan(event.entity, "load"));
  // Deferred a tick: the core tags a charge and registers its attack right
  // after spawnEntity returns, and a check before that would take it for an orphan.
  world.afterEvents.entitySpawn.subscribe((event) => {
    const entity = event.entity;
    if (entity.isValid && entity.typeId === CHARGE_ENTITY_ID) system.run(() => sweepIfOrphan(entity, "spawn"));
  });
  world.afterEvents.worldLoad.subscribe(() => system.run(sweepAll));
}
