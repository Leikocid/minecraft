// Entity hit → fixed Sonic Boom damage and a sculk patch, no crater (spec §5, §8, §9; L0-sclk-p004, r002, r004,
// adr-scdm §3, xasm23, xasm24). The damage mechanism is the one diagnose-CNTR-X22 and -X23 measured on BDS
// 1.26.51.1. Only the entity the bolt struck is touched. Deviations: README.md (C-16).

import {
  type Entity,
  EntityComponentTypes,
  EntityDamageCause,
  type EntityApplyDamageOptions,
  type EntityHealthComponent,
  type EntityHurtAfterEvent,
  GameMode,
  Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type BoltEvent, type BoltRecord, observeBolts } from "./bolt";
import { type CarveReport, probeOf, queueCarve } from "./carve";
import { feetCell, planPatch } from "./patch";

/** xasm23: the Warden's Sonic Boom on Normal, in HP. Never scaled by difficulty. */
export const SONIC_BOOM_DAMAGE = 10;
/**
 * The engine's hurt window: within this many ticks of the last hit that landed, an equal or weaker applyDamage
 * takes 0 and a stronger one only the difference, and applyDamage still returns true (CNTR-X22).
 */
export const HURT_WINDOW_TICKS = 10;
/** hp + this kills through anything a window, armour or absorption can hold back. */
const OVERKILL = 100;
/** Landed-hit entries older than the window are swept once the map grows past this. */
const LANDED_SWEEP_AT = 256;

/**
 * Not living (xasm24): hit, but never damaged; the patch is still placed. A TNT minecart or an end crystal
 * would explode on damage, which §5 forbids (no area damage).
 */
const NOT_LIVING: ReadonlySet<string> = new Set(
  [
    "armor_stand", "ender_crystal", "boat", "chest_boat", "minecart", "chest_minecart", "hopper_minecart",
    "tnt_minecart", "command_block_minecart",
  ].map((id) => `minecraft:${id}`)
);

/**
 * - `lethal`: hp ≤ D, one overkill applyDamage;
 * - `native`: applyDamage alone took D;
 * - `window`: applyDamage, then the health write inside a known window;
 * - `none`: no damage — the target is not living, or was gone before the hit resolved.
 */
export type HitPath = "lethal" | "native" | "window" | "none";

export interface HitReport {
  boltId: string;
  ownerId: string;
  targetId: string | undefined;
  targetType: string | undefined;
  living: boolean;
  path: HitPath;
  hpBefore: number | undefined;
  hpAfter: number | undefined;
  /** applyDamage's own answer; true also when the window swallowed the hit. */
  applied: boolean | undefined;
  inWindow: boolean;
  wrote: boolean;
  /** Undefined when the target was gone: such a hit ends like an expiry (p004 step 2). */
  patch: CarveReport | undefined;
  tick: number;
}

export type HitObserver = (report: HitReport) => void;

/** Entity id → the tick of the last hit on it that landed, from any source. */
const landed = new Map<string, number>();
const observers: HitObserver[] = [];
let windowWrite = true;
let armed = false;

const log = (msg: string): void => console.warn(`[andrew] sculk: ${msg}`);
const f2 = (n: number | undefined): string => (n === undefined ? "-" : n.toFixed(2));
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

export function observeHits(observer: HitObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

/** Off only for the T17 negative control (ac17): the same hits through applyDamage alone. */
export function setWindowWrite(on: boolean): void {
  windowWrite = on;
}

function emit(report: HitReport): void {
  for (const observer of [...observers]) {
    try {
      observer(report);
    } catch (err) {
      log(`hit observer threw for bolt ${report.boltId}: ${errText(err)}`);
    }
  }
}

function noteLanded(id: string, tick: number): void {
  landed.set(id, tick);
  if (landed.size <= LANDED_SWEEP_AT) return;
  for (const [key, at] of landed) if (tick - at >= HURT_WINDOW_TICKS) landed.delete(key);
}

function inWindow(id: string, tick: number): boolean {
  const at = landed.get(id);
  return at !== undefined && tick - at < HURT_WINDOW_TICKS;
}

function onHurt(event: EntityHurtAfterEvent): void {
  if (event.damage <= 0) return;
  try {
    noteLanded(event.hurtEntity.id, system.currentTick);
  } catch {
    // An entity removed in the same tick has nothing left to protect.
  }
}

/** Living = has health and is not a Creative or Spectator player (xasm24). */
function healthOf(entity: Entity): EntityHealthComponent | undefined {
  if (NOT_LIVING.has(entity.typeId)) return undefined;
  if (entity instanceof Player) {
    const mode = entity.getGameMode();
    if (mode === GameMode.Creative || mode === GameMode.Spectator) return undefined;
  }
  const health = entity.getComponent(EntityComponentTypes.Health);
  return health !== undefined && health.currentValue > 0 ? health : undefined;
}

function hpOf(health: EntityHealthComponent): number | undefined {
  try {
    return health.currentValue;
  } catch {
    return undefined;
  }
}

/** Stable 2.10.0 cannot read absorption; the effect is the only sign that a hit may have landed on it. */
function absorbing(entity: Entity): boolean {
  try {
    return entity.getEffect("absorption") !== undefined;
  } catch {
    return false;
  }
}

interface Strike {
  path: HitPath;
  hpAfter: number | undefined;
  applied: boolean;
  inWindow: boolean;
  wrote: boolean;
}

/**
 * Exactly D: absorption first, then health, through armour, Protection and a raised shield (cause sonicBoom),
 * or death when hp ≤ D, credited to the owner (C-28, r002).
 * - Outside a window, applyDamage alone is exact.
 * - Inside one it takes 0 or the difference, so health is written to hp − D. Never outside one: there the write
 *   would take D a second time from health after applyDamage took it from absorption.
 * - Cause `projectile` throws without a projectile, and `entityAttack` is cancelled by a raised shield.
 */
function strike(record: BoltRecord, target: Entity, health: EntityHealthComponent, hp: number): Strike {
  const now = system.currentTick;
  const owner = world.getEntity(record.ownerId);
  const options: EntityApplyDamageOptions = { cause: EntityDamageCause.sonicBoom };
  if (owner?.isValid === true) options.damagingEntity = owner;
  const known = inWindow(target.id, now);
  if (hp <= SONIC_BOOM_DAMAGE) {
    const applied = target.applyDamage(hp + OVERKILL, options);
    const after = hpOf(health);
    if (after === undefined || after < hp) noteLanded(target.id, now);
    return { path: "lethal", hpAfter: after, applied, inWindow: known, wrote: false };
  }
  const applied = target.applyDamage(SONIC_BOOM_DAMAGE, options);
  const after = hpOf(health);
  let wrote = false;
  if (windowWrite && known && after !== undefined && after > hp - SONIC_BOOM_DAMAGE) {
    // A write opens no window of its own (CNTR-X22), so it is never noted as a landed hit.
    wrote = health.setCurrentValue(hp - SONIC_BOOM_DAMAGE);
  }
  if (after !== undefined && after < hp) noteLanded(target.id, now);
  else if (!known && applied && absorbing(target)) noteLanded(target.id, now);
  return { path: wrote ? "window" : "native", hpAfter: hpOf(health), applied, inWindow: known, wrote };
}

function resolveHit(record: BoltRecord, entity: Entity | undefined): void {
  const report: HitReport = {
    boltId: record.id,
    ownerId: record.ownerId,
    targetId: undefined,
    targetType: undefined,
    living: false,
    path: "none",
    hpBefore: undefined,
    hpAfter: undefined,
    applied: undefined,
    inWindow: false,
    wrote: false,
    patch: undefined,
    tick: system.currentTick,
  };
  if (entity === undefined || !entity.isValid) {
    log(`bolt ${record.id} hit an entity that is gone: no damage, no patch`);
    emit(report);
    return;
  }
  report.targetId = entity.id;
  report.targetType = entity.typeId;
  const dimension = entity.dimension;
  const feet = feetCell(entity.location);
  try {
    const health = healthOf(entity);
    const hp = health === undefined ? undefined : hpOf(health);
    if (health !== undefined && hp !== undefined) {
      report.living = true;
      report.hpBefore = hp;
      Object.assign(report, strike(record, entity, health, hp));
    }
  } catch (err) {
    log(`bolt ${record.id} damage on ${entity.typeId} ${entity.id} refused: ${errText(err)}`);
  }
  report.patch = queueCarve("patch", record.id, dimension, planPatch(feet, record.seed, probeOf(dimension)));
  log(
    `hit entity ${report.targetType} ${report.targetId} hp ${f2(report.hpBefore)} -> ${f2(report.hpAfter)} (D ${SONIC_BOOM_DAMAGE}, ${report.path}` +
      `${report.inWindow ? ", in window" : ""}) bolt ${record.id} owner ${record.ownerName}; patch under ${fmt(feet)}: ${report.patch.plan.sculk.length} cells`
  );
  emit(report);
}

function onBolt(event: BoltEvent): void {
  if (event.kind === "entity") resolveHit(event.record, event.entity);
}

export function registerHit(): void {
  if (armed) return;
  armed = true;
  world.afterEvents.entityHurt.subscribe(onHurt);
  observeBolts(onBolt);
}
