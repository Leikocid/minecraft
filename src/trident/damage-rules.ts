// The Above-Water Trident's hit decisions and bookkeeping (spec §02 item 1; L0-trdt-r002, L0-adr-twlt, L0-trdt-addm),
// with no engine import: tests/trident-damage.test.mjs runs it under node. damage.ts is the engine side.

import { TRIDENT } from "../legendary/registry";
import { HURT_WINDOW_TICKS } from "../storm/damage-rules";

/** §02: every landed hit adds this much HP, before armour (L0-xasm34). */
export const TRIDENT_BONUS = 2;
/** probe-trident P2: a vanilla thrown trident hits for 8 before armour. The snowball-runtime body deals none (P10). */
export const THROWN_BASE = 8;
/** The custody key a thrown trident's entity carries (L0-trdt-g002, probe-trident P9): the throw's id. */
export const THROW_ID_PROPERTY = "andrew:tr.throw";
/** One throw adds its +2 to one target once: the key outlives the throw's 30 s return ceiling twice over. */
export const THROWN_KEY_TICKS = 1200;
/** A melee key carries its tick, so it only has to outlive that tick's hurt events. */
export const MELEE_KEY_TICKS = HURT_WINDOW_TICKS;
/** An accepted hit whose after-event has not come within this many ticks did not land. */
export const LANDING_TICKS = 2;
/** The attacker id of a hit with no damaging entity, e.g. a throw whose thrower left the game. */
export const NO_ATTACKER = "-";

export type HitKind = "melee" | "thrown";

export const meleeKey = (attackerId: string, tick: number, targetId: string): string => `m|${attackerId}|${tick}|${targetId}`;
export const thrownKey = (throwId: string, targetId: string): string => `t|${throwId}|${targetId}`;

/** What beforeEvents.entityHurt says about a hit. `living` and `stale` cost reads, so they are asked only when needed. */
export interface MeleeHit {
  cause: string;
  byPlayer: boolean;
  cancelled: boolean;
  /** One of the pack's own applyDamage calls (src/legendary/scripted-damage.ts), never a swing. */
  scripted: boolean;
  /** The attacker's main-hand item id; the off hand never melees (L0-xasm30). */
  mainHand: string | undefined;
  /** Has health, is not inanimate, is not a Creative or Spectator player (R-trdt-002 §3). */
  living: () => boolean;
  /** A marked copy whose generation was superseded (R-lgnd-005). */
  stale: () => boolean;
}

export type MeleeSkip = "cause" | "not-player" | "cancelled" | "scripted" | "not-trident" | "not-living" | "stale";

export function meleeSkip(hit: MeleeHit): MeleeSkip | undefined {
  if (hit.cause !== "entityAttack") return "cause";
  if (!hit.byPlayer) return "not-player";
  if (hit.cancelled) return "cancelled";
  if (hit.scripted) return "scripted";
  if (hit.mainHand !== TRIDENT.itemId) return "not-trident";
  if (!hit.living()) return "not-living";
  if (hit.stale()) return "stale";
  return undefined;
}

/** What projectileHitEntity says about a thrown hit. */
export interface ThrownHit {
  /** The entity's THROW_ID_PROPERTY: a string on a trident throw, anything else on every other projectile. */
  throwId: unknown;
  /** The target is the thrower. */
  self: boolean;
  living: () => boolean;
}

export type ThrownSkip = "no-throw" | "self" | "not-living";

export function thrownSkip(hit: ThrownHit): ThrownSkip | undefined {
  if (typeof hit.throwId !== "string" || hit.throwId.length === 0) return "no-throw";
  if (hit.self) return "self";
  if (!hit.living()) return "not-living";
  return undefined;
}

/**
 * One bonus and one strike per hit, however many events report it (R-trdt-002 §5): the first claim of a key wins,
 * every later claim while it is held loses. Held keys past their ticks are swept once the ledger grows.
 */
export class HitLedger {
  private readonly until = new Map<string, number>();

  constructor(private readonly sweepAt = 256) {}

  claim(key: string, now: number, ticks: number): boolean {
    const held = this.until.get(key);
    if (held !== undefined && held > now) return false;
    this.until.set(key, now + ticks);
    if (this.until.size > this.sweepAt) this.sweep(now);
    return true;
  }

  sweep(now: number): void {
    for (const [key, until] of this.until) if (until <= now) this.until.delete(key);
  }

  get size(): number {
    return this.until.size;
  }
}

/**
 * Accepted hits waiting for proof that they landed. The proof is afterEvents.entityHurt with damage above 0 from the
 * same attacker on the same target: a hit the 10-tick window swallows (its damage not above the window's last) never
 * gets one, so it never gets a strike (R-trdt-002 §5).
 */
export class LandingBook<T> {
  private entries: Array<{ targetId: string; attackerId: string; tick: number; payload: T }> = [];

  expect(targetId: string, attackerId: string, tick: number, payload: T): void {
    this.sweep(tick);
    this.entries.push({ targetId, attackerId, tick, payload });
  }

  /** The oldest waiting hit on `targetId` by `attackerId`, taken out of the book; undefined when none is waiting. */
  land(targetId: string, attackerId: string, now: number): T | undefined {
    this.sweep(now);
    const i = this.entries.findIndex((e) => e.targetId === targetId && e.attackerId === attackerId);
    if (i < 0) return undefined;
    const [entry] = this.entries.splice(i, 1);
    return entry.payload;
  }

  sweep(now: number): void {
    this.entries = this.entries.filter((e) => now - e.tick <= LANDING_TICKS);
  }

  get size(): number {
    return this.entries.length;
  }
}
