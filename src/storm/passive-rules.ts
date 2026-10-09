// The Storm Blade passive's decision (spec §02; L0-strm-ppas steps 1–2, C-32), with no engine import:
// tests/storm-passive.test.mjs runs it under node.

import { STORM_BLADE } from "../legendary/registry";

/** §02: every landed blade hit procs with this chance. */
export const PASSIVE_CHANCE = 0.3;

/** Uniform in [0, 1), Math.random's contract. */
export type Rng = () => number;


/** What the hurt event says about a hit. `living` and `stale` cost reads, so they are asked only when needed. */
export interface PassiveHit {
  cause: string;
  byPlayer: boolean;
  cancelled: boolean;
  /** One of the pack's own applyDamage calls (src/legendary/scripted-damage.ts): the active's 10, a Scythe hit. */
  scripted: boolean;
  /** The wielder's main-hand item id; the off hand never melees (L0-xasm30). */
  mainHand: string | undefined;
  /** Has health, is not an inanimate (an armour stand has health 6, probe-storm P5 F). */
  living: () => boolean;
  /** A marked copy whose generation was superseded (R-lgnd-005). */
  stale: () => boolean;
}

export type PassiveSkip = "cause" | "not-player" | "cancelled" | "scripted" | "not-blade" | "not-living" | "stale";

export type PassiveDecision = { kind: "skip"; why: PassiveSkip } | { kind: "proc" | "miss"; roll: number };

function skipOf(hit: PassiveHit): PassiveSkip | undefined {
  if (hit.cause !== "entityAttack") return "cause";
  if (!hit.byPlayer) return "not-player";
  if (hit.cancelled) return "cancelled";
  if (hit.scripted) return "scripted";
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
