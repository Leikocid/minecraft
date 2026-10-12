// The Underwater Bow's two fires (spec §1; L0-uwbw-r002, L0-uwbw-esfr, L0-xasm38). An ordinary hit of this bow's
// arrow sets the vanilla fire for 2 s, which water puts out as vanilla does. igniteSuperFire() is the call the armed
// hit makes: 1 HP of scripted fireTick a second that never looks at water, because the engine puts out any setOnFire
// in water within a tick (probe-ubow row 4). Rules without the engine: fire-rules.ts.
//
// Records live in memory only: a restart, the target's unload or its death ends Super Fire.

import {
  type Entity,
  EntityComponentTypes,
  EntityDamageCause,
  type EntityDieAfterEvent,
  type EntityHurtAfterEvent,
  type EntityHurtBeforeEvent,
  type EntitySpawnAfterEvent,
  EquipmentSlot,
  Player,
  type ProjectileHitBlockAfterEvent,
  system,
  world,
} from "@minecraft/server";
import { UNDERWATER_BOW } from "../legendary/registry";
import { applyScriptedDamage, isScriptedDamage } from "../legendary/scripted-damage";
import { isStale } from "../legendary/state";
import {
  ARROW_ID,
  ArrowBook,
  BURN_DAMAGE,
  LandingBook,
  SUPER_FIRE_SECONDS,
  SuperFireBook,
  isUnderwaterBowArrow,
  normalHitSkip,
  normalIgniteTicks,
  secondsToTicks,
  superVisual,
  suppressVanillaBurn,
} from "./fire-rules";

export { NORMAL_FIRE_SECONDS, SUPER_FIRE_SECONDS } from "./fire-rules";

const FLAME_PARTICLE = "minecraft:basic_flame_particle";

export type SuperEndReason = "spent" | "gone" | "dead";

export type UbowFireReport =
  | { type: "normal"; tick: number; targetId: string; arrowId: string; fireBefore: number; set: number | undefined; ok: boolean | undefined }
  | { type: "super"; tick: number; targetId: string; untilTick: number; refreshed: boolean }
  | { type: "burn"; tick: number; targetId: string; inWater: boolean; applied: boolean }
  | { type: "suppressed"; tick: number; targetId: string }
  | { type: "end"; tick: number; targetId: string; reason: SuperEndReason; burns: number };

export type UbowFireObserver = (report: UbowFireReport) => void;

const arrows = new ArrowBook();
const landing = new LandingBook();
const book = new SuperFireBook();
const targets = new Map<string, Entity>();
const observers: UbowFireObserver[] = [];
let intervalId: number | undefined;
let registered = false;

const log = (msg: string): void => console.warn(`[andrew] ub fire: ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

export function observeUbowFire(observer: UbowFireObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

function emit(report: UbowFireReport): void {
  for (const observer of [...observers]) {
    try {
      observer(report);
    } catch (err) {
      log(`observer threw for ${report.type} on ${report.targetId}: ${errText(err)}`);
    }
  }
}

function fireTicksOf(entity: Entity): number {
  try {
    return entity.getComponent(EntityComponentTypes.OnFire)?.onFireTicksRemaining ?? 0;
  } catch {
    return 0;
  }
}

function inWater(entity: Entity): boolean {
  try {
    return entity.isInWater;
  } catch {
    return false;
  }
}

function deadOrGone(entity: Entity | undefined): SuperEndReason | undefined {
  try {
    if (entity?.isValid !== true) return "gone";
    const health = entity.getComponent(EntityComponentTypes.Health);
    return health !== undefined && health.currentValue <= 0 ? "dead" : undefined;
  } catch {
    return "gone";
  }
}

/** Super Fire's ticks left on `target`, 0 when it is not burning with it. */
export function superFireTicksLeft(target: Entity): number {
  try {
    return book.ticksLeft(target.id, system.currentTick);
  } catch {
    return 0;
  }
}

/**
 * Sets `target` on Super Fire for `seconds`: a second call while it burns stretches the window and never stacks a
 * second fire (L0-uwbw-esfr). Must be called outside before-events: it puts the engine's flames on at once.
 */
export function igniteSuperFire(target: Entity, seconds = SUPER_FIRE_SECONDS): boolean {
  if (deadOrGone(target) !== undefined) return false;
  const now = system.currentTick;
  const targetId = target.id;
  const { fire, refreshed } = book.ignite(targetId, now, secondsToTicks(seconds));
  targets.set(targetId, target);
  log(`super ${refreshed ? "refreshed" : "lit"} on ${target.typeId} ${targetId} until tick ${fire.untilTick} (${seconds} s)`);
  emit({ type: "super", tick: now, targetId, untilTick: fire.untilTick, refreshed });
  paint(target, targetId, now);
  if (intervalId === undefined) intervalId = system.runInterval(tick, 1);
  return true;
}

function igniteNormal(target: Entity, arrowId: string): void {
  const now = system.currentTick;
  const targetId = target.id;
  const fireBefore = fireTicksOf(target);
  const set = normalIgniteTicks(fireBefore, book.ticksLeft(targetId, now));
  let ok: boolean | undefined;
  if (set !== undefined) {
    try {
      ok = target.setOnFire(set / 20, true);
    } catch (err) {
      log(`normal: setOnFire on ${targetId} threw ${errText(err)}`);
      ok = false;
    }
  }
  log(`normal hit by arrow ${arrowId} on ${target.typeId} ${targetId}: fire ${fireBefore} ticks before, ${set === undefined ? "kept" : `set ${set} ticks ok=${String(ok)}`}`);
  emit({ type: "normal", tick: now, targetId, arrowId, fireBefore, set, ok });
}

function paint(target: Entity, targetId: string, now: number): void {
  const fire = book.get(targetId);
  if (fire === undefined) return;
  const look = superVisual(inWater(target), fireTicksOf(target), book.ticksLeft(targetId, now), now - fire.startTick);
  try {
    if (look.kind === "flames") {
      target.setOnFire(look.seconds, true);
    } else if (look.kind === "particles") {
      const { x, y, z } = target.location;
      target.dimension.spawnParticle(FLAME_PARTICLE, { x, y: y + 0.4, z });
      target.dimension.spawnParticle(FLAME_PARTICLE, { x, y: y + 1.0, z });
    }
  } catch {
    // a target in an unloaded chunk shows nothing; its burn is decided by tick()
  }
}

function end(targetId: string, reason: SuperEndReason): void {
  const fire = book.drop(targetId);
  targets.delete(targetId);
  if (fire === undefined) return;
  log(`super ended on ${targetId}: ${reason} after ${fire.burns} burn(s)`);
  emit({ type: "end", tick: system.currentTick, targetId, reason, burns: fire.burns });
}

function tick(): void {
  const now = system.currentTick;
  for (const targetId of book.ids()) {
    const target = targets.get(targetId);
    const gone = deadOrGone(target);
    if (gone !== undefined || target === undefined) {
      end(targetId, gone ?? "gone");
      continue;
    }
    if (book.takeBurn(targetId, now)) {
      let applied = false;
      try {
        applied = applyScriptedDamage(target, BURN_DAMAGE, { cause: EntityDamageCause.fireTick });
      } catch (err) {
        log(`super burn on ${targetId} threw ${errText(err)}`);
      }
      emit({ type: "burn", tick: now, targetId, inWater: inWater(target), applied });
      const after = deadOrGone(target);
      if (after !== undefined) {
        end(targetId, after);
        continue;
      }
    }
    if (book.isSpent(targetId)) {
      end(targetId, "spent");
      continue;
    }
    paint(target, targetId, now);
  }
  if (book.size === 0 && intervalId !== undefined) {
    system.clearRun(intervalId);
    intervalId = undefined;
  }
}

/** The arrow spawns in the release tick with its owner readable (probe-ubow row 1); a non-player owner is never ours. */
function onSpawn(event: EntitySpawnAfterEvent): void {
  const arrow = event.entity;
  try {
    if (!arrow.isValid || arrow.typeId !== ARROW_ID) return;
    const owner = arrow.getComponent(EntityComponentTypes.Projectile)?.owner;
    if (!(owner instanceof Player) || !owner.isValid) return;
    const stack = owner.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand);
    const stale = stack !== undefined && stack.typeId === UNDERWATER_BOW.itemId && isStale(UNDERWATER_BOW, stack);
    if (!isUnderwaterBowArrow({ typeId: arrow.typeId, ownerIsPlayer: true, mainHand: stack?.typeId, stale })) return;
    arrows.remember(arrow.id, owner.id, system.currentTick);
  } catch {
    // an arrow or owner gone within the spawn tick is not a shot to follow
  }
}

function onHurtBefore(event: EntityHurtBeforeEvent): void {
  const cause = event.damageSource.cause;
  if (cause === EntityDamageCause.fireTick) {
    if (book.size === 0) return;
    let targetId: string;
    try {
      targetId = event.hurtEntity.id;
    } catch {
      return;
    }
    const now = system.currentTick;
    if (suppressVanillaBurn(cause, isScriptedDamage(), book.isBurning(targetId, now))) {
      event.cancel = true;
      emit({ type: "suppressed", tick: now, targetId });
    }
    return;
  }
  if (cause !== EntityDamageCause.projectile || arrows.size === 0) return;
  try {
    const arrowId = event.damageSource.damagingProjectile?.id;
    if (arrowId !== undefined && arrows.has(arrowId)) landing.expect(event.hurtEntity.id, arrowId, system.currentTick);
  } catch {
    // an unreadable projectile is not one of this bow's
  }
}

function onHurtAfter(event: EntityHurtAfterEvent): void {
  const cause = event.damageSource.cause;
  if (cause !== EntityDamageCause.projectile || landing.size === 0) return;
  const target = event.hurtEntity;
  let targetId: string;
  try {
    targetId = target.id;
  } catch {
    return;
  }
  const arrowId = landing.take(targetId, system.currentTick);
  if (normalHitSkip(cause, event.damage, arrows.has(arrowId)) !== undefined || arrowId === undefined) return;
  arrows.claim(arrowId);
  if (deadOrGone(target) === undefined) igniteNormal(target, arrowId);
}

function onHitBlock(event: ProjectileHitBlockAfterEvent): void {
  if (arrows.size === 0) return;
  try {
    arrows.forget(event.projectile.id);
  } catch {
    // swept by age instead
  }
}

function onDie(event: EntityDieAfterEvent): void {
  if (book.size === 0) return;
  try {
    const targetId = event.deadEntity.id;
    if (book.get(targetId) !== undefined) end(targetId, "dead");
  } catch {
    // a removed entity is ended by tick()
  }
}

export function registerUnderwaterBowFire(): void {
  if (registered) return;
  registered = true;
  world.afterEvents.entitySpawn.subscribe(onSpawn);
  world.beforeEvents.entityHurt.subscribe(onHurtBefore);
  world.afterEvents.entityHurt.subscribe(onHurtAfter);
  world.afterEvents.projectileHitBlock.subscribe(onHitBlock);
  world.afterEvents.entityDie.subscribe(onDie);
}
