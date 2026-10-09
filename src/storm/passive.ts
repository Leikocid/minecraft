// Storm Blade passive (spec §02; L0-strm-ppas): every landed melee hit of the blade in the main hand rolls 30 % on
// its own; a proc adds 6 HP before armour through src/storm/damage.ts and draws one visual strike. It owns no timer and
// never reads or writes the active's `sb` cooldown keys. The decision is passive-rules.ts; deviations: README.md.

import {
  type Dimension,
  type Entity,
  EntityComponentTypes,
  EntityDamageCause,
  type EntityHurtBeforeEvent,
  EquipmentSlot,
  type ItemStack,
  Player,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { STORM_BLADE } from "../legendary/registry";
import { isScriptedDamage } from "../legendary/scripted-damage";
import { isStale } from "../legendary/state";
import { PASSIVE_DAMAGE, type RaiseReport, raiseHit } from "./damage";
import { type PassiveDecision, type PassiveHit, type Rng, decidePassive } from "./passive-rules";
import { playStrikes } from "./visuals";

export { PASSIVE_CHANCE, type Rng } from "./passive-rules";

/** Draws one visual strike: no entity, no damage, no fire, no knockback (C-30, L0-adr-sblt A). */
export type StrikeVisual = (dimension: Dimension, at: Vector3) => void;

/** One roll of the passive on a landed blade hit. Hits that are not the passive's are not reported. */
export interface PassiveReport {
  tick: number;
  targetId: string;
  targetType: string;
  wielderId: string;
  roll: number;
  proc: boolean;
  /** The helper's report on a proc; undefined on a miss. */
  raise: RaiseReport | undefined;
  /** A strike was scheduled: a proc whose bonus lands (plan `raise` or `lethal`). */
  strike: boolean;
}

export type PassiveObserver = (report: PassiveReport) => void;

let rng: Rng = Math.random;
let strikeVisual: StrikeVisual = drawStrike;
const observers: PassiveObserver[] = [];
let armed = false;

const log = (msg: string): void => console.warn(`[andrew] storm passive: ${msg}`);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** Tests force a proc or a miss; no argument restores Math.random. */
export function setStormRng(next?: Rng): void {
  rng = next ?? Math.random;
}

/** The strike every proc draws; no argument restores drawStrike. */
export function setStrikeVisual(next?: StrikeVisual): void {
  strikeVisual = next ?? drawStrike;
}

export function observePassive(observer: PassiveObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

/** §02: one strike per proc, on the visuals interval's next step. */
const PASSIVE_STRIKE_DELAYS: readonly number[] = [0];

/** The active's own strike (visuals.ts): a spark column down onto the target's feet, the flash there, the impact sound. */
export function drawStrike(dimension: Dimension, at: Vector3): void {
  playStrikes(dimension, at, at, PASSIVE_STRIKE_DELAYS);
}

function living(entity: Entity): boolean {
  try {
    const health = entity.getComponent(EntityComponentTypes.Health);
    // Inside the event health already reads hp − damage: a killing blow reads 0 and still rolls (raiseHit: kills-alone).
    return health !== undefined && !entity.matches({ families: ["inanimate"] });
  } catch {
    return false;
  }
}

function mainHandOf(player: Player): ItemStack | undefined {
  return player.getComponent(EntityComponentTypes.Equippable)?.getEquipment(EquipmentSlot.Mainhand);
}

function emit(report: PassiveReport): void {
  for (const observer of [...observers]) {
    try {
      observer(report);
    } catch (err) {
      log(`observer threw on ${report.targetId}: ${errText(err)}`);
    }
  }
}

function onHurt(event: EntityHurtBeforeEvent): void {
  const source = event.damageSource;
  // Every hurt in the world passes here; only a melee is worth reading the wielder's hand for.
  if (source.cause !== EntityDamageCause.entityAttack) return;
  const wielder = source.damagingEntity;
  const target = event.hurtEntity;
  let decision: PassiveDecision;
  try {
    const player = wielder instanceof Player ? wielder : undefined;
    const stack = player === undefined ? undefined : mainHandOf(player);
    const hit: PassiveHit = {
      cause: source.cause,
      byPlayer: player !== undefined,
      cancelled: event.cancel,
      scripted: isScriptedDamage(),
      mainHand: stack?.typeId,
      living: () => living(target),
      stale: () => stack !== undefined && isStale(STORM_BLADE, stack),
    };
    decision = decidePassive(hit, rng);
  } catch (err) {
    log(`hit not read: ${errText(err)}`);
    return;
  }
  if (decision.kind === "skip" || wielder === undefined) return;
  const report: PassiveReport = {
    tick: system.currentTick,
    targetId: target.id,
    targetType: target.typeId,
    wielderId: wielder.id,
    roll: decision.roll,
    proc: decision.kind === "proc",
    raise: undefined,
    strike: false,
  };
  if (report.proc) {
    report.raise = raiseHit(event, PASSIVE_DAMAGE);
    if (report.raise.plan === "raise" || report.raise.plan === "lethal") {
      report.strike = true;
      const dimension = target.dimension;
      const at = { ...target.location };
      // Before-events may not change the world; the strike lands later in the same tick.
      system.run(() => strikeVisual(dimension, at));
    }
  }
  emit(report);
}

/** Subscribes the passive once. Hits before it are not rolled. */
export function registerStormPassive(): void {
  if (armed) return;
  armed = true;
  world.beforeEvents.entityHurt.subscribe(onHurt);
}
