// The Underwater Bow's armed charge, the part that needs no engine (spec v3 §1; L0-xcx33, L0-xasm38, L0-uwbw-parm,
// L0-uwbw-phit, L0-uwbw-earm, R-uwbw-001): the arming decision, which arrow carries the charge, what counts as a
// successful hit, and the HUD state. tests/ubow-ability.test.mjs runs it under node; ability.ts is the engine side.

import { UNDERWATER_BOW } from "../legendary/registry";

/** §1: the armed hit deals exactly this much before armour, replacing the arrow's own damage (C-29). */
export const ARMED_DAMAGE = 14;
/** §1: the cooldown a successful armed hit starts. The registry's value, restated so the unit test pins it. */
export const ARMED_COOLDOWN_TICKS = UNDERWATER_BOW.cooldownTicks;
/** An armed arrow that has resolved nothing after this long is dropped as a miss. */
export const ARMED_ARROW_TICKS = 600;
/**
 * A before-event pairing whose after-event has not come within this many ticks did not land. The arrow's hurt and its
 * after-event come in the same tick (probe-ubow row 1); a projectileHitEntity with no landing is settled after this too.
 */
export const LANDING_TICKS = 2;
/** A refused arming re-shows the cooldown at most this often, so a held Use on a block does not repaint every tick. */
export const REFUSAL_HINT_TICKS = 10;

const LEDGER_PREFIX = "andrew:ub_armed:";

/**
 * World property holding a player's charge. A world property and not a player one: it survives logout, death and a
 * restart the same way, and unlike a SimulatedPlayer's own properties it is still there after a restart to be read.
 */
export function armedKey(playerId: string): string {
  return `${LEDGER_PREFIX}${playerId}`;
}

/** The player id a ledger key belongs to, or undefined for any other key. */
export function playerOfKey(key: string): string | undefined {
  return key.startsWith(LEDGER_PREFIX) && key.length > LEDGER_PREFIX.length ? key.slice(LEDGER_PREFIX.length) : undefined;
}

/** Only `true` is a charge; an absent or foreign value is none. */
export const isCharge = (raw: unknown): boolean => raw === true;

export interface ArmInput {
  /** A live (not stale) Underwater Bow in the main hand, read in the before-event of the press. */
  bowInMainHand: boolean;
  sneaking: boolean;
  armed: boolean;
  /** Milliseconds left on the bow's cooldown; 0 when ready. */
  cooldownMs: number;
}

/**
 * What a Use with the bow does to the charge (L0-xcx33 default):
 * - `arm` — sneaking, ready, not armed: the charge is set, the draw goes on;
 * - `already` — sneaking and already armed: nothing;
 * - `refused` — sneaking during the cooldown: nothing is set, the HUD shows the seconds left;
 * - `plain` — not sneaking: an ordinary draw, the charge is not touched;
 * - `not-bow` — the press is not this bow's.
 */
export type ArmDecision = "arm" | "already" | "refused" | "plain" | "not-bow";

export function armDecision(i: ArmInput): ArmDecision {
  if (!i.bowInMainHand) return "not-bow";
  if (!i.sneaking) return "plain";
  if (i.cooldownMs > 0) return "refused";
  if (i.armed) return "already";
  return "arm";
}

/** The HUD line of a held bow (L0-uwbw-earm). A cooldown outranks a charge; the two never coexist through this module. */
export type ChargeState = "ready" | "armed" | "cooldown";

export function chargeState(armed: boolean, cooldownMs: number): ChargeState {
  if (cooldownMs > 0) return "cooldown";
  return armed ? "armed" : "ready";
}

/**
 * The arrows that carry a charge, by entity id, and the one in flight per shooter. Only the first arrow fired after
 * arming carries it; while it flies, later arrows are plain; once it misses, the next arrow carries it again.
 */
export class ArmedShotBook {
  private readonly shots = new Map<string, { shooterId: string; bornTick: number }>();
  private readonly pending = new Map<string, string>();

  /** Whether `shooterId`'s next arrow carries the charge: armed, and no armed arrow of theirs still unresolved. */
  marks(shooterId: string, armed: boolean, now: number): boolean {
    this.sweep(now);
    return armed && !this.pending.has(shooterId);
  }

  mark(arrowId: string, shooterId: string, now: number): void {
    this.shots.set(arrowId, { shooterId, bornTick: now });
    this.pending.set(shooterId, arrowId);
  }

  shooterOf(arrowId: string | undefined): string | undefined {
    return arrowId === undefined ? undefined : this.shots.get(arrowId)?.shooterId;
  }

  pendingOf(shooterId: string): string | undefined {
    return this.pending.get(shooterId);
  }

  /** Drops the arrow, hit or miss, and frees its shooter for the next armed arrow. Returns the shooter. */
  resolve(arrowId: string): string | undefined {
    const rec = this.shots.get(arrowId);
    if (rec === undefined) return undefined;
    this.shots.delete(arrowId);
    if (this.pending.get(rec.shooterId) === arrowId) this.pending.delete(rec.shooterId);
    return rec.shooterId;
  }

  /** Arrows older than ARMED_ARROW_TICKS, dropped as misses. */
  sweep(now: number): string[] {
    const old: string[] = [];
    for (const [id, rec] of this.shots) if (now - rec.bornTick > ARMED_ARROW_TICKS) old.push(id);
    for (const id of old) this.resolve(id);
    return old;
  }

  get size(): number {
    return this.shots.size;
  }
}

/** Why a hurt is not an armed hit to rewrite. */
export type HitSkip = "cause" | "not-armed" | "self" | "not-living" | "cancelled" | "no-damage";

export interface HitInput {
  cause: string;
  /** The damaging projectile is an armed arrow in the book. */
  armedShot: boolean;
  /** The target is the arrow's own shooter. */
  self: boolean;
  /** Has health, is not inanimate (an armour stand, a boat, a minecart), and is not a Creative or Spectator player. */
  living: () => boolean;
  cancelled: boolean;
  /** The hit's damage as the before-event read it. */
  read: number;
}

/** R-uwbw-001 as the before-event can judge it; undefined when the hit is rewritten to exactly 14 before armour. */
export function armedHitSkip(h: HitInput): HitSkip | undefined {
  if (h.cause !== "projectile") return "cause";
  if (!h.armedShot) return "not-armed";
  if (h.self) return "self";
  if (h.cancelled) return "cancelled";
  if (!(h.read > 0)) return "no-damage";
  if (!h.living()) return "not-living";
  return undefined;
}

/** setHit's plan (storm/damage-rules.ts), or `none` when it did not admit the hit. */
export type SetPlanKind = "set" | "lethal" | "kills-alone" | "none";

/**
 * Whether a rewritten hit landed and spends the charge. A `set` or `kills-alone` hit must reach the after-event with
 * damage above 0: the hurt window or another handler's cancel otherwise swallowed it. A `lethal` hit was written to 0
 * and its overkill follows through system.run whatever the after-event reads, so it counts as landed.
 */
export function landedHit(plan: SetPlanKind, afterDamage: number | undefined): boolean {
  if (plan === "lethal") return true;
  if (plan === "none") return false;
  return afterDamage !== undefined && afterDamage > 0;
}

/** One rewritten hit waiting for its after-event, by target id. */
export class LandingBook<T> {
  private readonly pending = new Map<string, { tick: number; data: T }>();

  expect(targetId: string, now: number, data: T): void {
    this.pending.set(targetId, { tick: now, data });
  }

  /** Takes the pairing for `targetId`, or undefined when there is none or it is older than LANDING_TICKS. */
  take(targetId: string, now: number): T | undefined {
    const rec = this.pending.get(targetId);
    if (rec === undefined) return undefined;
    this.pending.delete(targetId);
    return now - rec.tick <= LANDING_TICKS ? rec.data : undefined;
  }

  /** Takes the pairing only if it is still `data`: a later hit on the same target has replaced it otherwise. */
  takeIf(targetId: string, data: T): boolean {
    const rec = this.pending.get(targetId);
    if (rec === undefined || rec.data !== data) return false;
    this.pending.delete(targetId);
    return true;
  }

  has(predicate: (data: T) => boolean): boolean {
    for (const rec of this.pending.values()) if (predicate(rec.data)) return true;
    return false;
  }

  get size(): number {
    return this.pending.size;
  }
}
