// The Scythe's volley over plain values (spec §4–5). Pure: nothing from
// @minecraft/server is imported at runtime, so node tests bundle this file
// without a stub. volley.ts feeds it engine positions and acts on its answers.

import { type Vec3, distance } from "./targeting-rules";

export type { Vec3 };

export const PROJECTILE_COUNT = 3;

/** Ticks between two launches [src: decision-scythe-projectiles, "~0.5 s"]. */
export const LAUNCH_INTERVAL_TICKS = 10;

/** Blocks per tick. A sprinting player covers ~0.28, so a runner cannot outpace it. */
export const PROJECTILE_SPEED = 0.8;

/** A projectile this close to the aim point has hit. */
export const HIT_RADIUS = 1.0;

/** Pursuit radius around the launch point (spec §5). */
export const PURSUIT_RADIUS = 20;

/** Whole-volley lifetime [src: decision-scythe-projectiles, "~10 s"]. */
export const VOLLEY_TIMEOUT_TICKS = 200;

/** Exactly 3 HP per hit, past armour and Protection (spec §4). */
export const TRUE_DAMAGE = 3;

/** The aim point sits this far above the target's feet: mid-body. */
export const AIM_HEIGHT = 1.0;

export type EndReason = "spent" | "out_of_radius" | "timeout" | "target_invalid" | "error";

export type CooldownVerdict = "full" | "none";

/** One step of `speed` from `from` towards `to`; lands on `to` when it is nearer than a step. */
export function stepTowards(from: Vec3, to: Vec3, speed: number = PROJECTILE_SPEED): Vec3 {
  const len = distance(from, to);
  if (len <= speed) {
    return { x: to.x, y: to.y, z: to.z };
  }
  const k = speed / len;
  return { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z + (to.z - from.z) * k };
}

export function isHit(projectile: Vec3, aim: Vec3, radius: number = HIT_RADIUS): boolean {
  return distance(projectile, aim) <= radius;
}

export function aimPoint(targetFeet: Vec3): Vec3 {
  return { x: targetFeet.x, y: targetFeet.y + AIM_HEIGHT, z: targetFeet.z };
}

/**
 * Whether the target has left the pursuit zone. Horizontal distance only: each
 * hit throws the target ~10 blocks up, and three stacked throws reach ~30 above
 * the launch point — a sphere would let the weapon's own launch abort it.
 */
export function outOfRadius(launchPoint: Vec3, target: Vec3, radius: number = PURSUIT_RADIUS): boolean {
  return Math.hypot(target.x - launchPoint.x, target.z - launchPoint.z) > radius;
}

/**
 * The cooldown owed when a volley ends (spec §5): any hit costs the full
 * cooldown, whatever ended the volley; no hit costs nothing — a volley that
 * never landed is a failed activation, like a Use with no target.
 */
export function cooldownVerdict(hits: number, _reason: EndReason): CooldownVerdict {
  return hits > 0 ? "full" : "none";
}

/** HP to leave the target with, or "lethal" when the hit must go through applyDamage. */
export function trueDamageOutcome(hp: number, damage: number = TRUE_DAMAGE): number | "lethal" {
  const left = hp - damage;
  return left > 0 ? left : "lethal";
}

/** How one hit is delivered. */
export type StrikePlan =
  | { readonly kind: "lethal" }
  | { readonly kind: "write"; readonly goal: number }
  | { readonly kind: "damage-then-write"; readonly goal: number };

/**
 * The operator's decision of 2026-09-24 delivers a survivable hit as one direct
 * write and a lethal one through applyDamage. The damage call in front of the
 * write buys the red flash, the hurt sound and a mob turning on its attacker;
 * it is dropped while the target absorbs, because there the pipeline takes the
 * damage off the shield of hearts and the write then takes it off health again.
 */
export function strikePlan(hp: number, absorbing: boolean, damage: number = TRUE_DAMAGE): StrikePlan {
  const outcome = trueDamageOutcome(hp, damage);
  if (outcome === "lethal") {
    return { kind: "lethal" };
  }
  return absorbing ? { kind: "write", goal: outcome } : { kind: "damage-then-write", goal: outcome };
}

/** Tick, counted from launch, on which projectile `index` leaves the owner. */
export function launchTick(index: number): number {
  return index * LAUNCH_INTERVAL_TICKS;
}
