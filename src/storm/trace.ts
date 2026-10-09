// The Storm Blade's line and its one target (spec §02; L0-strm-pact steps 3–4, L0-strm-rcd §4–6, L0-strm-adtr,
// L0-xasm31). The block stop is the Katana's own `trace` with range 10, imported, not copied. @minecraft/server is
// imported for types only: tests/storm-active.test.mjs runs this file on a fake reader, and the ability passes
// `player.dimension` unchanged.

import type { Dimension, Direction, Vector3 } from "@minecraft/server";
import { type KatanaWorld, type StopReason, trace } from "../katana/plan";

/** Spec §02: the line reaches at most this far from the eye, Euclidean. */
export const ACTIVE_RANGE = 10;

/** Where the line ends and why. Read once, at the press. */
export interface StormLine {
  readonly head: Vector3;
  /** Unit view direction. */
  readonly dir: Vector3;
  /** The first solid block's hit point, the 10-block cap, or just short of an unloaded cell. */
  readonly stop: Vector3;
  /** |stop − head|, ≤ ACTIVE_RANGE. */
  readonly length: number;
  readonly stoppedBy: StopReason;
  readonly face: Direction | undefined;
  readonly block: Vector3 | undefined;
}

/** What `pick` reads from a dimension: the entity ray only. */
export interface EntityRayReader<E> {
  getEntitiesFromRay(
    location: Vector3,
    direction: Vector3,
    options: { maxDistance: number; ignoreBlockCollision: boolean }
  ): ReadonlyArray<{ readonly entity: E; readonly distance: number }>;
}

type Expect<T extends true> = T;
/** `pick(player.dimension, …)` must keep compiling. */
export type DimensionIsEntityRayReader = Expect<Dimension extends EntityRayReader<unknown> ? true : false>;

export interface Pick<E> {
  readonly entity: E;
  /** From the eye to the entity's box, along the line. */
  readonly distance: number;
  /** Where the line enters the box: the line's end and the first strike's flash. */
  readonly point: Vector3;
}

const along = (from: Vector3, dir: Vector3, t: number): Vector3 => ({ x: from.x + dir.x * t, y: from.y + dir.y * t, z: from.z + dir.z * t });

/**
 * The line from `head` along `view`. Undefined when there is no line: a zero view, or a block ray that threw, where
 * the solid's place is unknown — the caller refuses rather than guess (Katana deviation 5).
 */
export function planLine(world: KatanaWorld, head: Vector3, view: Vector3): StormLine | undefined {
  const len = Math.hypot(view.x, view.y, view.z);
  if (!(len > 0)) return undefined;
  const dir = { x: view.x / len, y: view.y / len, z: view.z / len };
  const tr = trace(world, head, dir, ACTIVE_RANGE);
  if (tr.failed) return undefined;
  // The Katana pulls its endpoint back off the face; the blade's line ends on it.
  const stop = tr.hit?.point ?? tr.endpoint;
  const length = Math.min(ACTIVE_RANGE, Math.hypot(stop.x - head.x, stop.y - head.y, stop.z - head.z));
  return { head, dir, stop, length, stoppedBy: tr.stoppedBy, face: tr.hit?.face, block: tr.hit?.block };
}

/**
 * The first entity on `line` that `eligible` accepts, never one past the stop. The entity ray runs with
 * `ignoreBlockCollision` and is cut at the stop: on its own it stops at grass, torches and signs the line passes, and
 * passes diagonal walls the line stops at (probe-storm P5). Hits are taken nearest first; the rest are never touched.
 */
export function pick<E>(reader: EntityRayReader<E>, line: StormLine, eligible: (entity: E) => boolean): Pick<E> | undefined {
  if (!(line.length > 0)) return undefined;
  const hits = [...reader.getEntitiesFromRay(line.head, line.dir, { maxDistance: line.length, ignoreBlockCollision: true })];
  hits.sort((a, b) => a.distance - b.distance);
  for (const hit of hits) {
    if (!(hit.distance <= line.length)) break;
    if (eligible(hit.entity)) return { entity: hit.entity, distance: hit.distance, point: along(line.head, line.dir, hit.distance) };
  }
  return undefined;
}
