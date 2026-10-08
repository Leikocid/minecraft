// Storm Blade damage: the only place the blade deals its 10 (active) and +6 (passive) HP before armour (spec §02,
// §05; L0-strm-rdmg, L0-adr-sbdm R and C, L0-xcx26). Every path here is one that diagnose-CNTR-X26 and probe-storm
// P2–P3 measured on BDS 1.26.51.1. Deviations: README.md next to this file.

import {
  type Entity,
  type EntityApplyDamageOptions,
  EntityComponentTypes,
  EntityDamageCause,
  type EntityHealthComponent,
  type EntityHurtAfterEvent,
  type EntityHurtBeforeEvent,
  EquipmentSlot,
  GameMode,
  ItemComponentTypes,
  Player,
  system,
  world,
} from "@minecraft/server";
import {
  type Defence,
  NO_DEFENCE,
  OVERKILL,
  PASSIVE_DAMAGE,
  type RaisePlan,
  type StrikePath,
  afterArmour,
  inHurtWindow,
  planRaise,
  planStrike,
  windowWrite,
} from "./damage-rules";

export {
  ACTIVE_DAMAGE,
  type Defence,
  HURT_WINDOW_TICKS,
  NO_DEFENCE,
  OVERKILL,
  PASSIVE_DAMAGE,
  type RaisePlan,
  type StrikePath,
  afterArmour,
} from "./damage-rules";

const ARMOUR_SLOTS = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
/** Landed-hit entries older than the window are swept once the map grows past this. */
const LANDED_SWEEP_AT = 256;

/** One applyDamage call: the active's hit, or the overkill that finishes a passive whose raise would be lethal. */
export interface StrikeReport {
  type: "strike";
  /** `passive` only for the deferred lethal of `raiseHit`. */
  from: "active" | "passive";
  targetId: string;
  targetType: string;
  wielderId: string | undefined;
  /** D, raw. */
  damage: number;
  /** f(D): what a vanilla entityAttack of D takes from this target. */
  dPrime: number;
  defence: Defence;
  /** `none`: the target is not living or was gone. */
  path: StrikePath | "none";
  hpBefore: number | undefined;
  hpAfter: number | undefined;
  /** applyDamage's own answer: false when a raised shield cancelled it, true also when the window swallowed it. */
  applied: boolean | undefined;
  inWindow: boolean;
  wrote: boolean;
  tick: number;
}

/** The passive's raise of a melee hit, decided inside beforeEvents.entityHurt. */
export interface RaiseReport {
  type: "raise";
  targetId: string;
  targetType: string;
  wielderId: string | undefined;
  damage: number;
  /** f(D) on top of the hit. */
  bonus: number;
  /** The hit's damage as the event read it: already after armour and Resistance. */
  read: number;
  /** Health as read inside the event: already less the hit's read. */
  hpLeft: number | undefined;
  defence: Defence;
  /** `none`: not a living target's entityAttack hit with a source, or already cancelled. */
  plan: RaisePlan["kind"] | "none";
  /** What the event's damage was set to; undefined when it was left alone. */
  set: number | undefined;
  tick: number;
}

export type StormReport = StrikeReport | RaiseReport;
export type StormObserver = (report: StormReport) => void;

/** Entity id → the tick of the last hit on it that landed, from any source. */
const landed = new Map<string, number>();
const observers: StormObserver[] = [];
let armed = false;

const log = (msg: string): void => console.warn(`[andrew] storm: ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined ? "-" : n.toFixed(2));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];
const defText = (d: Defence): string => `A${d.armor} T${d.toughness} P${d.protection} R${d.resistance}`;

export function observeStorm(observer: StormObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

function emit(report: StormReport): void {
  for (const observer of [...observers]) {
    try {
      observer(report);
    } catch (err) {
      log(`observer threw for ${report.type} on ${report.targetId}: ${errText(err)}`);
    }
  }
}

function noteLanded(id: string, tick: number): void {
  landed.set(id, tick);
  if (landed.size <= LANDED_SWEEP_AT) return;
  for (const [key, at] of landed) if (!inHurtWindow(at, tick)) landed.delete(key);
}

function onHurt(event: EntityHurtAfterEvent): void {
  if (event.damage <= 0) return;
  try {
    noteLanded(event.hurtEntity.id, system.currentTick);
  } catch {
    // An entity removed in the same tick has nothing left to protect.
  }
}

/** Living = has health and is not a Creative or Spectator player; `alive` also asks for health above 0. */
function healthOf(entity: Entity, alive = true): EntityHealthComponent | undefined {
  if (entity instanceof Player) {
    const mode = entity.getGameMode();
    if (mode === GameMode.Creative || mode === GameMode.Spectator) return undefined;
  }
  const health = entity.getComponent(EntityComponentTypes.Health);
  return health !== undefined && (!alive || health.currentValue > 0) ? health : undefined;
}

function hpOf(health: EntityHealthComponent): number | undefined {
  try {
    return health.currentValue;
  } catch {
    return undefined;
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

/** Mobs have no equippable in 2.10.0, so their worn and natural armour read as none (README, deviation 1). */
export function defenceOf(entity: Entity): Defence {
  let armor = 0;
  let toughness = 0;
  let protection = 0;
  let resistance = 0;
  try {
    const eq = entity.getComponent(EntityComponentTypes.Equippable);
    if (eq !== undefined) {
      armor = eq.totalArmor;
      toughness = eq.totalToughness;
      for (const slot of ARMOUR_SLOTS) {
        protection += eq.getEquipment(slot)?.getComponent(ItemComponentTypes.Enchantable)?.getEnchantment("protection")?.level ?? 0;
      }
    }
  } catch {
    return { ...NO_DEFENCE, resistance: resistanceOf(entity) };
  }
  resistance = resistanceOf(entity);
  return { armor, toughness, protection, resistance };
}

function resistanceOf(entity: Entity): number {
  try {
    const effect = entity.getEffect("resistance");
    return effect === undefined ? 0 : effect.amplifier + 1;
  } catch {
    return 0;
  }
}

function attackOptions(wielder: Entity | undefined): EntityApplyDamageOptions {
  const options: EntityApplyDamageOptions = { cause: EntityDamageCause.entityAttack };
  if (wielder?.isValid === true) options.damagingEntity = wielder;
  return options;
}

function blankStrike(from: StrikeReport["from"], target: Entity, damage: number, wielder: Entity | undefined): StrikeReport {
  let targetId = "?";
  let targetType = "?";
  try {
    targetId = target.id;
    targetType = target.typeId;
  } catch {
    // a removed entity keeps nothing readable
  }
  return {
    type: "strike",
    from,
    targetId,
    targetType,
    wielderId: wielder?.isValid === true ? wielder.id : undefined,
    damage,
    dPrime: 0,
    defence: NO_DEFENCE,
    path: "none",
    hpBefore: undefined,
    hpAfter: undefined,
    applied: undefined,
    inWindow: false,
    wrote: false,
    tick: system.currentTick,
  };
}

function finish(report: StrikeReport): StrikeReport {
  log(
    `${report.from} ${report.path} on ${report.targetType} ${report.targetId}: D ${report.damage} -> D' ${f2(report.dPrime)} (${defText(report.defence)}) ` +
      `hp ${f2(report.hpBefore)} -> ${f2(report.hpAfter)} applied=${String(report.applied)}${report.inWindow ? " in window" : ""}${report.wrote ? " wrote" : ""}`
  );
  emit(report);
  return report;
}

/**
 * Deals `damage` before armour to `target` as an entityAttack from `wielder`, exactly once (L0-strm-rdmg): the
 * target loses f(damage) whether or not a hit landed on it in the last 10 ticks.
 * - The return value of applyDamage is not proof of damage; the report's hp reads are.
 * - On `applied` false (a raised shield facing the wielder) nothing is written.
 */
export function stormDamage(target: Entity, damage: number, wielder: Entity | undefined): StrikeReport {
  if (!armed) {
    log("stormDamage before registerStormDamage(): hits before this one are not known, so their windows are not");
    registerStormDamage();
  }
  const report = blankStrike("active", target, damage, wielder);
  if (!target.isValid) return finish(report);
  try {
    const health = healthOf(target);
    const hp = health === undefined ? undefined : hpOf(health);
    if (health === undefined || hp === undefined) return finish(report);
    const now = system.currentTick;
    const defence = defenceOf(target);
    const dPrime = afterArmour(damage, defence);
    const known = inHurtWindow(landed.get(target.id), now);
    const absorbs = absorbing(target);
    const path = planStrike(hp, dPrime, known, absorbs);
    Object.assign(report, { defence, dPrime, hpBefore: hp, inWindow: known, path });
    const options = attackOptions(wielder);
    const applied = target.applyDamage(path === "lethal" ? hp + OVERKILL : damage, options);
    report.applied = applied;
    let after = hpOf(health);
    if (path === "window" && after !== undefined) {
      const goal = windowWrite(applied, hp, after, dPrime);
      // A write opens no window of its own (CNTR-X22), so it is never noted as a landed hit.
      if (goal !== undefined) report.wrote = health.setCurrentValue(goal);
      after = hpOf(health);
    }
    report.hpAfter = after;
    if (after !== undefined && after < hp) noteLanded(target.id, now);
    else if (!known && applied && absorbs) noteLanded(target.id, now);
  } catch (err) {
    log(`damage on ${report.targetType} ${report.targetId} refused: ${errText(err)}`);
  }
  return finish(report);
}

/** The overkill after a raise that would have been lethal: the totem, death message and credit stay native. */
function finishLethal(target: Entity, wielder: Entity | undefined, damage: number, bonus: number, defence: Defence): void {
  const report = blankStrike("passive", target, damage, wielder);
  Object.assign(report, { dPrime: bonus, defence, path: "lethal", inWindow: true });
  try {
    const health = target.isValid ? healthOf(target) : undefined;
    const hp = health === undefined ? undefined : hpOf(health);
    if (health === undefined || hp === undefined) {
      report.path = "none";
      finish(report);
      return;
    }
    report.hpBefore = hp;
    report.applied = target.applyDamage(hp + OVERKILL, attackOptions(wielder));
    report.hpAfter = hpOf(health);
  } catch (err) {
    log(`lethal passive on ${report.targetType} ${report.targetId} refused: ${errText(err)}`);
  }
  finish(report);
}

/**
 * The passive's +`damage` before armour, called from a beforeEvents.entityHurt handler on the blade's own melee hit
 * (L0-strm-ppas step 4): the hit itself grows by f(damage), so the window that swallows a separate applyDamage never
 * sees a second hit (X26: 14.00 / 3.80 / 1.30 in one native event).
 * - Only an entityAttack with a damaging entity is raised; the caller decides it is the blade's.
 * - A raise that would make the hit lethal is not written; an overkill applyDamage follows through system.run.
 */
export function raiseHit(event: EntityHurtBeforeEvent, damage: number = PASSIVE_DAMAGE): RaiseReport {
  const target = event.hurtEntity;
  const wielder = event.damageSource.damagingEntity;
  const report: RaiseReport = {
    type: "raise",
    targetId: "?",
    targetType: "?",
    wielderId: undefined,
    damage,
    bonus: 0,
    read: event.damage,
    hpLeft: undefined,
    defence: NO_DEFENCE,
    plan: "none",
    set: undefined,
    tick: system.currentTick,
  };
  try {
    report.targetId = target.id;
    report.targetType = target.typeId;
    report.wielderId = wielder?.id;
    const health = healthOf(target, false);
    report.hpLeft = health === undefined ? undefined : hpOf(health);
    if (event.cancel || event.damageSource.cause !== EntityDamageCause.entityAttack || wielder === undefined || report.hpLeft === undefined) {
      emit(report);
      return report;
    }
    report.defence = defenceOf(target);
    report.bonus = afterArmour(damage, report.defence);
    const plan = planRaise(event.damage, report.hpLeft, report.bonus, absorbing(target));
    report.plan = plan.kind;
    if (plan.kind === "raise") {
      event.damage = plan.damage;
      report.set = plan.damage;
    } else if (plan.kind === "lethal") {
      const { bonus, defence } = report;
      // Before-events may not apply damage; system.run lands the overkill after this hit.
      system.run(() => finishLethal(target, wielder, damage, bonus, defence));
    }
  } catch (err) {
    log(`raise on ${report.targetType} ${report.targetId} refused: ${errText(err)}`);
  }
  log(
    `passive ${report.plan} on ${report.targetType} ${report.targetId}: read ${f2(report.read)} + f(${damage}) ${f2(report.bonus)} (${defText(report.defence)}) ` +
      `hp left ${f2(report.hpLeft)}${report.set === undefined ? "" : ` -> hit ${f2(report.set)}`}`
  );
  emit(report);
  return report;
}

/** Arms the landed-hit record the window path depends on. Call at script load: hits before it are unknown. */
export function registerStormDamage(): void {
  if (armed) return;
  armed = true;
  world.afterEvents.entityHurt.subscribe(onHurt);
}
