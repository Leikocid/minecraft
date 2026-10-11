// Above-Water Trident movement, the part that needs no engine (spec §02 items 2–3; L0-trdt-pmov,
// L0-adr-twrp): the release decision, the dash impulse, the one-shot fall grant and the swim kick.
// Every calibration number cites its section of docs/feedback/probe-trident.md; the unit test
// tests/trident-movement.test.mjs reads them back out of that file.

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface VecXZ {
  readonly x: number;
  readonly z: number;
}

/** `use_duration` 3600 s in above_water_trident.json; the charge is this minus `useDuration` at release (probe §3). */
export const USE_TICKS = 72_000;
/** Vanilla's trident minimum: a shorter charge neither throws nor dashes (L0-adr-twrp §1). */
export const MIN_CHARGE_TICKS = 10;

/** applyKnockback per unit of horizontal view: Riptide III's 3.00 b/t over one unit's 0.400 b/t (probe §4). */
export const DASH_H = 7.5;
/** applyKnockback per unit of vertical view: 3.00 b/t over one unit's 1.000 b/t (probe §4). */
export const DASH_V = 3.0;
/** Vanilla Riptide III's launch speed along the view, blocks per tick (probe §4). */
export const RIPTIDE_SPEED = 3.0;
/** Riptide III's landing distance from flat ground in rain, by pitch (probe §4, table "Число"). */
export const RIPTIDE_LANDING: ReadonlyMap<number, number> = new Map([
  [-30, 17.85],
  [-45, 14.87],
]);
/** How far a dash may land from the Riptide III value (xasm37, L0-trdt-a003). */
export const DASH_TOLERANCE = 0.2;
export const RIPTIDE_SOUND = "item.trident.riptide_3";

/** The katana's FALL_FLAG_MS (10 000 ms, xasm36) in ticks: an unused grant lives this long. */
export const GRANT_TICKS = 200;
/** isOnGround still reads the take-off for two ticks after a launch (src/katana/fall.ts STALE_TICKS). */
export const STALE_TICKS = 2;
/**
 * Contact must hold this many interval ticks before it ends the grant: the landing tick's fall hurt
 * can reach the before-event after the interval has already seen the ground.
 */
export const CONTACT_TICKS = 2;

/** Sprint-swim without the trident, blocks per second (probe §6). */
export const SWIM_BASE_BPS = 3.87;
/** Land sprint, the speed the spec points at, blocks per second (probe §6). */
export const SWIM_TARGET_BPS = 5.61;
/** applyKnockback per tick along the horizontal view; holds 5.66 b/s while sprint-swimming (probe §6). */
export const SWIM_KICK = 0.34;
/** Never kick above target + 15 % (L0-trdt-pmov): a faster body is mid-dash or in a current, and a kick would brake it. */
export const SWIM_CAP_BPT = (SWIM_TARGET_BPS * 1.15) / 20;
/** A swimmer who is not sprint-swimming counts as moving at this forward speed, blocks per tick. */
export const SWIM_MOVING_BPT = 0.03;

export type ReleaseDecision = "dash" | "throw" | "none";

/** Ticks charged at release; an engine that reports more than the full duration charged nothing. */
export function chargeTicks(useDuration: number, full: number = USE_TICKS): number {
  return Math.max(0, full - useDuration);
}

/** Sneaking release dashes, plain release throws (trident-input, CX-L0-28); a short charge does neither. */
export function releaseDecision(r: { trident: boolean; sneaking: boolean; charge: number }): ReleaseDecision {
  if (!r.trident || r.charge < MIN_CHARGE_TICKS) return "none";
  return r.sneaking ? "dash" : "throw";
}

/** The arguments of applyKnockback for a dash along the full view vector, upward included. */
export function dashImpulse(view: Vec3): { horizontal: VecXZ; vertical: number } {
  return { horizontal: { x: view.x * DASH_H, z: view.z * DASH_H }, vertical: view.y * DASH_V };
}

export interface FallGrant {
  readonly armedTick: number;
  readonly expiresTick: number;
  readonly contactTicks: number;
}

/** `contact`: on the ground, in water or climbing — any of them ends a fall without damage. */
export interface GrantSample {
  readonly tick: number;
  readonly contact: boolean;
}

export type GrantEnd = "landed" | "expired";

/** A dash arms a fresh grant; a second dash replaces the first, grants never stack. */
export function newGrant(tick: number): FallGrant {
  return { armedTick: tick, expiresTick: tick + GRANT_TICKS, contactTicks: 0 };
}

export function grantLive(g: FallGrant, tick: number): boolean {
  return tick <= g.expiresTick;
}

/** One interval tick over a grant: the next state, and why it ended when it did. */
export function stepGrant(g: FallGrant, s: GrantSample): { grant: FallGrant; end?: GrantEnd } {
  if (!grantLive(g, s.tick)) return { grant: g, end: "expired" };
  if (s.tick <= g.armedTick + STALE_TICKS) return { grant: g };
  const contactTicks = s.contact ? g.contactTicks + 1 : 0;
  const grant = { ...g, contactTicks };
  return contactTicks >= CONTACT_TICKS ? { grant, end: "landed" } : { grant };
}

export interface SwimSample {
  readonly holding: boolean;
  readonly inWater: boolean;
  readonly swimming: boolean;
  /** Blocks per tick. */
  readonly velocity: Vec3;
  readonly view: Vec3;
}

/** The horizontal applyKnockback for this tick, or undefined when the player gets none. */
export function swimKick(s: SwimSample): VecXZ | undefined {
  if (!s.holding || !s.inWater) return undefined;
  const h = Math.hypot(s.view.x, s.view.z);
  if (h < 1e-3) return undefined;
  const dir = { x: s.view.x / h, z: s.view.z / h };
  if (Math.hypot(s.velocity.x, s.velocity.z) >= SWIM_CAP_BPT) return undefined;
  if (!s.swimming && s.velocity.x * dir.x + s.velocity.z * dir.z < SWIM_MOVING_BPT) return undefined;
  return { x: dir.x * SWIM_KICK, z: dir.z * SWIM_KICK };
}
