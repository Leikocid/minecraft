// The Storm Blade passive's decision (spec §02; L0-strm-ppas steps 1–2, C-32), with no engine import:
// tests/storm-passive.test.mjs runs it under node.

import { STORM_BLADE } from "../legendary/registry";

/** §02: every landed blade hit procs with this chance. */
export const PASSIVE_CHANCE = 0.3;

/** Uniform in [0, 1), Math.random's contract. */
export type Rng = () => number;

/**
 * probe-storm P1: both ids are declared in the vanilla 1.26.50 resource pack. Bedrock has no particle named "flash";
 * the lab-table explosion stands in for it. A wrong id throws nothing on the server, so the unit test checks these.
 */
export const STRIKE_SPARK = "minecraft:electric_spark_particle";
export const STRIKE_FLASH = "minecraft:huge_explosion_lab_misc_emitter";
export const STRIKE_SOUND = "ambient.weather.lightning.impact";
/** The spark column: this many blocks tall, one spark every STRIKE_STEP blocks. */
export const STRIKE_HEIGHT = 8;
export const STRIKE_STEP = 0.5;

/** What the hurt event says about a hit. `living` and `stale` cost reads, so they are asked only when needed. */
export interface PassiveHit {
  cause: string;
  byPlayer: boolean;
  cancelled: boolean;
  /** src/storm/damage.ts is inside its own applyDamage: the hit is the blade's ability damage, not a melee. */
  stormDealing: boolean;
  /** The wielder's main-hand item id; the off hand never melees (L0-xasm30). */
  mainHand: string | undefined;
  /** Has health, is not an inanimate (an armour stand has health 6, probe-storm P5 F). */
  living: () => boolean;
  /** A marked copy whose generation was superseded (R-lgnd-005). */
  stale: () => boolean;
}

export type PassiveSkip = "cause" | "not-player" | "cancelled" | "storm-damage" | "not-blade" | "not-living" | "stale";

export type PassiveDecision = { kind: "skip"; why: PassiveSkip } | { kind: "proc" | "miss"; roll: number };

function skipOf(hit: PassiveHit): PassiveSkip | undefined {
  if (hit.cause !== "entityAttack") return "cause";
  if (!hit.byPlayer) return "not-player";
  if (hit.cancelled) return "cancelled";
  if (hit.stormDealing) return "storm-damage";
  if (hit.mainHand !== STORM_BLADE.itemId) return "not-blade";
  if (!hit.living()) return "not-living";
  if (hit.stale()) return "stale";
  return undefined;
}

/**
 * One landed hit: a skip draws nothing from `rng`, an eligible hit draws exactly one number. Nothing is kept between
 * calls, so each roll is independent of every earlier one (no streak, no pity) and the passive owns no cooldown.
 */
export function decidePassive(hit: PassiveHit, rng: Rng): PassiveDecision {
  const why = skipOf(hit);
  if (why !== undefined) return { kind: "skip", why };
  const roll = rng();
  return { kind: roll < PASSIVE_CHANCE ? "proc" : "miss", roll };
}

/** Spark points of one strike, bottom to top, from the target's feet. */
export function strikeColumn(at: { x: number; y: number; z: number }): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = [];
  for (let dy = 0; dy <= STRIKE_HEIGHT + 1e-9; dy += STRIKE_STEP) points.push({ x: at.x, y: at.y + dy, z: at.z });
  return points;
}
