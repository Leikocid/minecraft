// The Above-Water Trident's hits (spec §02 item 1; L0-trdt-r002, L0-adr-twlt, L0-trdt-addm, CX-L0-29): every landed
// hit on a living target, melee or thrown, is the vanilla hit plus f(2) in the same hurt event, and draws exactly one
// strike with the Storm Blade's visuals. Nothing here spawns an entity. Limitations: README.md.

import {
  type Dimension,
  type Entity,
  type EntityApplyDamageOptions,
  EntityComponentTypes,
  EntityDamageCause,
  type EntityHurtAfterEvent,
  type EntityHurtBeforeEvent,
  EquipmentSlot,
  GameMode,
  type ItemStack,
  Player,
  type ProjectileHitEntityAfterEvent,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { TRIDENT } from "../legendary/registry";
import { applyScriptedDamage, isScriptedDamage } from "../legendary/scripted-damage";
import { isStale } from "../legendary/state";
import { OVERKILL, type RaiseReport, afterArmour, defenceOf, raiseHit } from "../storm/damage";
import { planRaise } from "../storm/damage-rules";
import { playStrikes } from "../storm/visuals";
import {
  type HitKind,
  HitLedger,
  LandingBook,
  MELEE_KEY_TICKS,
  type MeleeSkip,
  NO_ATTACKER,
  THROWN_BASE,
  THROWN_KEY_TICKS,
  THROW_ID_PROPERTY,
  TRIDENT_BONUS,
  type ThrownSkip,
  meleeKey,
  meleeSkip,
  thrownKey,
  thrownSkip,
} from "./damage-rules";

export { THROWN_BASE, THROW_ID_PROPERTY, TRIDENT_BONUS } from "./damage-rules";

/** One strike per landed hit, on the visuals interval's next step. */
const STRIKE_DELAYS: readonly number[] = [0];

/** A trident hit as decided: in beforeEvents.entityHurt for a melee or a body's own hit, in thrownHit for a scripted one. */
export interface TridentHitReport {
  type: "hit";
  kind: HitKind;
  tick: number;
  targetId: string;
  targetType: string;
  attackerId: string;
  /** The idempotency key; undefined when the hit was skipped before one was made. */
  key: string | undefined;
  /** Why nothing was added, `duplicate` for a key already claimed, else the raise plan (storm/damage-rules.ts). */
  outcome: MeleeSkip | ThrownSkip | "duplicate" | RaiseReport["plan"] | "refused";
  /** The hit as the event read it: after armour and Resistance. */
  read: number | undefined;
  /** f(2) on top of it. */
  bonus: number;
  /** What the event's damage was set to; undefined when it was left alone. */
  set: number | undefined;
  /** Thrown only: `native` raised the body's own projectile hit, `scripted` dealt the base itself. */
  via: "native" | "scripted" | undefined;
  /** Scripted only: applyDamage's answer, which is true also when the window swallowed the hit. */
  applied: boolean | undefined;
}

/** The strike of a hit that landed: its after-event came with damage above 0. */
export interface TridentStrikeReport {
  type: "strike";
  kind: HitKind;
  tick: number;
  targetId: string;
  attackerId: string;
  key: string;
  /** The landed damage as the after-event read it. */
  damage: number;
}

export type TridentReport = TridentHitReport | TridentStrikeReport;
export type TridentObserver = (report: TridentReport) => void;

interface Landing {
  kind: HitKind;
  key: string;
  dimension: Dimension;
  foot: Vector3;
  flash: Vector3;
}

/** The thrown hit whose applyDamage is in flight: its beforeEvents.entityHurt runs inside that call. */
interface PendingThrown {
  targetId: string;
  thrower: Entity | undefined;
  report: TridentHitReport;
  seen: boolean;
}

const ledger = new HitLedger();
const landing = new LandingBook<Landing>();
const observers: TridentObserver[] = [];
let pending: PendingThrown | undefined;
let armed = false;

const log = (msg: string): void => console.warn(`[andrew] trident: ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined ? "-" : n.toFixed(2));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

export function observeTrident(observer: TridentObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

function emit(report: TridentReport): void {
  for (const observer of [...observers]) {
    try {
      observer(report);
    } catch (err) {
      log(`observer threw for ${report.type} on ${report.targetId}: ${errText(err)}`);
    }
  }
}

function idOf(entity: Entity | undefined): string {
  try {
    return entity?.isValid === true ? entity.id : NO_ATTACKER;
  } catch {
    return NO_ATTACKER;
  }
}

/** Has health, is not inanimate (an armour stand has health 6) and is not a Creative or Spectator player. */
function living(entity: Entity): boolean {
  try {
    if (entity instanceof Player) {
      const mode = entity.getGameMode();
      if (mode === GameMode.Creative || mode === GameMode.Spectator) return false;
    }
    return entity.getComponent(EntityComponentTypes.Health) !== undefined && !entity.matches({ families: ["inanimate"] });
  } catch {
    return false;
  }
}

/** Stable 2.10.0 cannot read absorption; the effect is the only sign of it. */
function absorbing(entity: Entity): boolean {
  try {
    return entity.getEffect("absorption") !== undefined;
  } catch {
    return false;
  }
}

function attackOptions(attacker: Entity | undefined): EntityApplyDamageOptions {
  const options: EntityApplyDamageOptions = { cause: EntityDamageCause.entityAttack };
  if (attacker?.isValid === true) options.damagingEntity = attacker;
  return options;
}

function blank(kind: HitKind, target: Entity, attackerId: string, tick: number): TridentHitReport {
  let targetId = "?";
  let targetType = "?";
  try {
    targetId = target.id;
    targetType = target.typeId;
  } catch {
    // a removed entity keeps nothing readable
  }
  return { type: "hit", kind, tick, targetId, targetType, attackerId, key: undefined, outcome: "refused", read: undefined, bonus: 0, set: undefined, via: undefined, applied: undefined };
}

function finish(report: TridentHitReport): TridentHitReport {
  log(
    `${report.kind}${report.via === undefined ? "" : `/${report.via}`} ${report.outcome} on ${report.targetType} ${report.targetId} by ${report.attackerId}: read ${f2(report.read)} + f(${TRIDENT_BONUS}) ${f2(report.bonus)}` +
      `${report.set === undefined ? "" : ` -> hit ${f2(report.set)}`}${report.applied === undefined ? "" : ` applied=${String(report.applied)}`}`
  );
  emit(report);
  return report;
}

function expectLanding(kind: HitKind, key: string, target: Entity, attackerId: string, tick: number, flash?: Vector3): void {
  const foot = { ...target.location };
  landing.expect(target.id, attackerId, tick, { kind, key, dimension: target.dimension, foot, flash: flash === undefined ? foot : { ...flash } });
}

function mainHandOf(player: Player): ItemStack | undefined {
  return player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand);
}

/**
 * The melee: the engine's own hit grows by f(2) through the Storm Blade passive's helper, as L0-trdt-addm §2 decides.
 * It is called on a hit the engine made, from this before-event, which is exactly the case raiseHit is built for.
 */
function onMelee(event: EntityHurtBeforeEvent): void {
  const source = event.damageSource;
  const attacker = source.damagingEntity;
  const target = event.hurtEntity;
  const player = attacker instanceof Player ? attacker : undefined;
  let stack: ItemStack | undefined;
  let why: MeleeSkip | undefined;
  try {
    stack = player === undefined ? undefined : mainHandOf(player);
    why = meleeSkip({
      cause: source.cause,
      byPlayer: player !== undefined,
      cancelled: event.cancel,
      scripted: isScriptedDamage(),
      mainHand: stack?.typeId,
      living: () => living(target),
      stale: () => stack !== undefined && isStale(TRIDENT, stack),
    });
  } catch (err) {
    log(`melee not read: ${errText(err)}`);
    return;
  }
  // Every melee in the world passes here; only the trident's own are reported.
  if (why === "cause" || why === "not-player" || why === "not-trident" || player === undefined) return;
  const now = system.currentTick;
  const report = blank("melee", target, player.id, now);
  if (why !== undefined) {
    report.outcome = why;
    finish(report);
    return;
  }
  try {
    const key = meleeKey(player.id, now, target.id);
    report.key = key;
    if (!ledger.claim(key, now, MELEE_KEY_TICKS)) {
      report.outcome = "duplicate";
      finish(report);
      return;
    }
    const raise = raiseHit(event, TRIDENT_BONUS);
    Object.assign(report, { outcome: raise.plan, read: raise.read, bonus: raise.bonus, set: raise.set });
    if (raise.plan !== "none") expectLanding("melee", key, target, player.id, now, target.getHeadLocation());
  } catch (err) {
    log(`melee on ${report.targetType} ${report.targetId} refused: ${errText(err)}`);
  }
  finish(report);
}

/** The thrown hit's own raise, inside the before-event of the body's hit or of the base hit thrownHit deals. */
function raiseThrown(event: EntityHurtBeforeEvent, thrower: Entity | undefined, report: TridentHitReport): void {
  const target = event.hurtEntity;
  report.read = event.damage;
  try {
    // Inside this event health already reads hp − read, so the lethal check uses what the hit leaves.
    const hpLeft = target.getComponent(EntityComponentTypes.Health)?.currentValue;
    if (event.cancel || hpLeft === undefined) {
      report.outcome = "none";
      return;
    }
    report.bonus = afterArmour(TRIDENT_BONUS, defenceOf(target));
    const plan = planRaise(event.damage, hpLeft, report.bonus, absorbing(target));
    report.outcome = plan.kind;
    if (plan.kind === "raise") {
      event.damage = plan.damage;
      report.set = plan.damage;
    } else if (plan.kind === "lethal") {
      // A rewrite to a lethal value eats the totem (probe-storm P3); before-events may not apply damage.
      system.run(() => finishLethal(target, thrower));
    }
  } catch (err) {
    report.outcome = "refused";
    log(`thrown raise on ${report.targetType} ${report.targetId} refused: ${errText(err)}`);
  }
}

function finishLethal(target: Entity, thrower: Entity | undefined): void {
  try {
    if (!target.isValid) return;
    const hp = target.getComponent(EntityComponentTypes.Health)?.currentValue;
    if (hp === undefined || hp <= 0) return;
    applyScriptedDamage(target, hp + OVERKILL, attackOptions(thrower));
  } catch (err) {
    log(`thrown lethal on ${target.typeId} refused: ${errText(err)}`);
  }
}

function onHurtBefore(event: EntityHurtBeforeEvent): void {
  const thrown = pending;
  if (thrown !== undefined && !thrown.seen && isScriptedDamage()) {
    let mine = false;
    try {
      mine = event.hurtEntity.id === thrown.targetId;
    } catch {
      mine = false;
    }
    if (mine) {
      thrown.seen = true;
      raiseThrown(event, thrown.thrower, thrown.report);
      return;
    }
  }
  if (event.damageSource.cause === EntityDamageCause.projectile) onThrownNative(event);
  else onMelee(event);
}

/**
 * A throw's body with impact damage of its own: its hit arrives here as cause `projectile` with the body as the damaging
 * projectile, and is raised in place. The body's projectileHitEntity then finds the key claimed.
 */
function onThrownNative(event: EntityHurtBeforeEvent): void {
  const source = event.damageSource;
  let throwId: unknown;
  let flash: Vector3 | undefined;
  let owner: Entity | undefined;
  try {
    const body = source.damagingProjectile;
    throwId = body?.getDynamicProperty(THROW_ID_PROPERTY);
    if (typeof throwId !== "string") return;
    flash = body?.location;
    owner = body?.getComponent(EntityComponentTypes.Projectile)?.owner;
  } catch {
    return;
  }
  const target = event.hurtEntity;
  // On the snowball runtime the hurt's damaging entity is the body itself; its after-event carries the same one.
  const hitter = source.damagingEntity;
  const hitterId = idOf(hitter);
  const thrower = owner ?? (hitter === source.damagingProjectile ? undefined : hitter);
  const throwerId = idOf(thrower);
  const now = system.currentTick;
  const report = blank("thrown", target, throwerId, now);
  report.via = "native";
  try {
    const why = thrownSkip({ throwId, self: throwerId !== NO_ATTACKER && throwerId === target.id, living: () => living(target) });
    if (why !== undefined) {
      report.outcome = why;
      finish(report);
      return;
    }
    const key = thrownKey(throwId, target.id);
    report.key = key;
    if (!ledger.claim(key, now, THROWN_KEY_TICKS)) {
      report.outcome = "duplicate";
      finish(report);
      return;
    }
    expectLanding("thrown", key, target, hitterId, now, flash);
    raiseThrown(event, thrower, report);
  } catch (err) {
    report.outcome = "refused";
    log(`native thrown hit on ${report.targetType} ${report.targetId} refused: ${errText(err)}`);
  }
  finish(report);
}

function onHurtAfter(event: EntityHurtAfterEvent): void {
  if (event.damage <= 0 || landing.size === 0) return;
  const cause = event.damageSource.cause;
  if (cause !== EntityDamageCause.entityAttack && cause !== EntityDamageCause.projectile) return;
  let targetId: string;
  try {
    targetId = event.hurtEntity.id;
  } catch {
    return;
  }
  const attackerId = idOf(event.damageSource.damagingEntity);
  const now = system.currentTick;
  const hit = landing.land(targetId, attackerId, now);
  if (hit === undefined) return;
  playStrikes(hit.dimension, hit.foot, hit.flash, STRIKE_DELAYS);
  const report: TridentStrikeReport = { type: "strike", kind: hit.kind, tick: now, targetId, attackerId, key: hit.key, damage: event.damage };
  log(`${hit.kind} strike on ${targetId} by ${attackerId}: landed ${f2(event.damage)}`);
  emit(report);
}

/**
 * The thrown hit: `throwId`'s base hit plus f(2) on `target`, from `thrower` when it is still valid, and one strike if
 * it lands. Safe to call more than once per hit: only the first call for (throwId, target) does anything.
 *
 * This path is its own, not storm/damage.ts's raiseHit:
 * - a body with impact damage hits as cause `projectile`, and raiseHit gives any cause but entityAttack plan `none`
 *   (CX-trdt-02): onThrownNative raises that hit itself;
 * - a body with none (probe-trident P10: the snowball runtime dealt no hurt) leaves no engine hit for raiseHit to grow:
 *   here the trident deals the base 8 itself and raises that hit inside its own before-event;
 * - raiseHit needs a damaging entity, so a throw whose thrower left the game would lose its bonus;
 * - raiseHit reports to the Storm Blade's observers and logs as its passive, and knows nothing of a throw's id, which is
 *   the key that keeps a second event for the same hit from adding a second bonus.
 */
export function thrownHit(target: Entity, thrower: Entity | undefined, throwId: string, at?: Vector3): TridentHitReport {
  if (!armed) registerTridentDamage();
  const now = system.currentTick;
  const throwerId = idOf(thrower);
  const report = blank("thrown", target, throwerId, now);
  try {
    const why = thrownSkip({ throwId, self: throwerId !== NO_ATTACKER && throwerId === target.id, living: () => living(target) });
    if (why !== undefined) {
      report.outcome = why;
      return finish(report);
    }
    const key = thrownKey(throwId, target.id);
    report.key = key;
    if (!ledger.claim(key, now, THROWN_KEY_TICKS)) {
      report.outcome = "duplicate";
      return finish(report);
    }
    expectLanding("thrown", key, target, throwerId, now, at);
    report.via = "scripted";
    const state: PendingThrown = { targetId: target.id, thrower, report, seen: false };
    pending = state;
    try {
      report.applied = applyScriptedDamage(target, THROWN_BASE, attackOptions(thrower));
    } finally {
      pending = undefined;
    }
    if (!state.seen) report.outcome = "none";
  } catch (err) {
    report.outcome = "refused";
    log(`thrown hit on ${report.targetType} ${report.targetId} refused: ${errText(err)}`);
  }
  return finish(report);
}

/** A projectile carrying THROW_ID_PROPERTY is a trident throw, whatever entity type it is. */
function onProjectileHit(event: ProjectileHitEntityAfterEvent): void {
  let throwId: unknown;
  let thrower: Entity | undefined;
  let target: Entity | undefined;
  try {
    const projectile = event.projectile;
    throwId = projectile.getDynamicProperty(THROW_ID_PROPERTY);
    if (typeof throwId !== "string") return;
    thrower = event.source ?? projectile.getComponent(EntityComponentTypes.Projectile)?.owner;
    target = event.getEntityHit().entity;
  } catch {
    // A projectile removed before this after-event reads as invalid: thrownHit is the way in for its owner.
    return;
  }
  if (target === undefined) return;
  thrownHit(target, thrower, throwId, event.location);
}

/** Subscribes the trident's hits once. Must run at script load: a hit before it gets no bonus and no strike. */
export function registerTridentDamage(): void {
  if (armed) return;
  armed = true;
  world.beforeEvents.entityHurt.subscribe(onHurtBefore);
  world.afterEvents.entityHurt.subscribe(onHurtAfter);
  world.afterEvents.projectileHitEntity.subscribe(onProjectileHit);
}
