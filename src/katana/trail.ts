// Dragon Katana petal trail (spec §8; R-katn-007, L0-katn-r007, L0-katn-gl05).
// Spawned only after a successful teleport, entirely inside the activation
// tick: no interval or timeout is ever armed here, so without a jump this
// module performs no periodic work (C-5e).
//
// Particle choice: KATA-PROBE-01 P6 only shows `minecraft:cherry_leaves_particle`
// does not throw — the same "no throw" also comes back for a particle id that
// does not exist, so it is not proof the id renders (docs/feedback/probe-katana.md
// #6). Whether it renders is an iPad call deferred to L0-katn-ac09. This ships
// the resource-pack fallback the rule names for that case (`andrew:katana_petal`).

import { type Dimension, type Vector3, system } from "@minecraft/server";
import { type Activation, observeActivations } from "./activation";

/** R-katn-007: distance between trail points, in blocks. */
export const TRAIL_STEP = 0.5;
/** R-katn-007: the 20-block range caps the trail at this many points (20 / 0.5 + 1). */
export const MAX_TRAIL_POINTS = 41;
/** R-katn-007: particles spawned at each point. */
export const PARTICLES_PER_POINT = 3;
/** R-katn-007 fallback, a pink billboard defined in packs/resource/particles/katana_petal.json. */
export const TRAIL_PARTICLE = "andrew:katana_petal";
/** A and B are feet positions; the trail itself runs at roughly chest height. */
const LIFT: Vector3 = { x: 0, y: 1, z: 0 };

const callTicks: number[] = [];

/** Total spawnParticle calls recorded so far — the counter AC06 #1/#2 reads. */
export function trailCallCount(): number {
  return callTicks.length;
}

/** The tick of each recorded call, in order — AC06 #1's "within ≤ 10 ticks". */
export function trailCallTicks(): readonly number[] {
  return callTicks;
}

export function resetTrailCallCount(): void {
  callTicks.length = 0;
}

const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const lerp = (a: Vector3, b: Vector3, k: number): Vector3 => ({
  x: a.x + (b.x - a.x) * k,
  y: a.y + (b.y - a.y) * k,
  z: a.z + (b.z - a.z) * k,
});

/** Points from `a` to `b` every TRAIL_STEP blocks, both ends included, capped at MAX_TRAIL_POINTS. */
export function trailPoints(a: Vector3, b: Vector3): Vector3[] {
  const length = Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
  const steps = Math.min(MAX_TRAIL_POINTS - 1, Math.max(1, Math.round(length / TRAIL_STEP)));
  const points: Vector3[] = [];
  for (let i = 0; i <= steps; i++) points.push(lerp(a, b, i / steps));
  return points;
}

function isLoaded(dimension: Dimension, point: Vector3): boolean {
  try {
    return dimension.isChunkLoaded(point);
  } catch {
    return false;
  }
}

/**
 * Spawns the trail from A to B at chest height. A point in an unloaded chunk
 * is skipped silently — no exception, no log line — the trail is cosmetic and
 * costs nothing but the petal (spec §8, C-12).
 */
export function spawnTrail(dimension: Dimension, a: Vector3, b: Vector3): void {
  for (const point of trailPoints(add(a, LIFT), add(b, LIFT))) {
    if (!isLoaded(dimension, point)) continue;
    for (let i = 0; i < PARTICLES_PER_POINT; i++) {
      try {
        dimension.spawnParticle(TRAIL_PARTICLE, point);
        callTicks.push(system.currentTick);
      } catch {
        // Cosmetic only: an engine refusal here costs nothing but the petal.
      }
    }
  }
}

export function registerPetalTrail(): void {
  observeActivations((activation: Activation) => {
    if (!activation.jumped) return;
    spawnTrail(activation.player.dimension, activation.plan.origin, activation.plan.feet as Vector3);
  });
}
