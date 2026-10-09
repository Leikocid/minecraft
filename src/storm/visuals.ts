// Storm Blade visuals: the wind-and-spark line and the lightning strikes, drawn with particles and a sound only (spec
// §02, §05; L0-strm-rvis, L0-adr-sblt A, C-30). Nothing here spawns an entity, writes a block or touches health, so
// nothing here can hurt, ignite, push or convert. Every particle comes from one shared interval that exists only while
// a burst is queued (runJob is never used: its start stalls the next tick by 15–30 ms on BDS 1.26.51.1).

import { type Dimension, type Vector3, system } from "@minecraft/server";

/**
 * probe-storm P1: declared in the vanilla resource pack of 1.26.50.4. The server answers a made-up id exactly like a
 * real one, so these are pinned by tests/storm-active.test.mjs against the probe's vanilla list; only the iPad shows
 * them. Bedrock has no particle named "flash": the lab explosion emitter stands in.
 */
export const SPARK_PARTICLE = "minecraft:electric_spark_particle";
export const WIND_PARTICLE = "minecraft:wind_explosion_emitter";
export const FLASH_PARTICLE = "minecraft:huge_explosion_lab_misc_emitter";
export const STORM_PARTICLES: readonly string[] = [SPARK_PARTICLE, WIND_PARTICLE, FLASH_PARTICLE];
/** L0-adr-sblt A: the vanilla lightning impact sound, played at each strike. */
export const STRIKE_SOUND = "ambient.weather.lightning.impact";

/** L0-strm-rvis: one line point every half block. */
export const LINE_STEP = 0.5;
/** A wind burst on every second line point, a spark on each. */
const WIND_EVERY = 2;
/** L0-strm-rvis: a strike column runs from this far above its foot down to it. */
export const STRIKE_HEIGHT = 6;
const STRIKE_STEP = 0.5;
/** Sideways zigzag of a strike column. */
const STRIKE_JITTER = 0.3;
/** Ticks after the release: the line, then three strikes inside 6 ticks (L0-strm-pact step 6). */
export const LINE_DELAY = 0;
export const ACTIVE_STRIKE_DELAYS: readonly number[] = [1, 3, 5];
const STRIKE_VOLUME = 1;

type Burst =
  | { kind: "line"; due: number; dimension: Dimension; from: Vector3; to: Vector3 }
  | { kind: "strike"; due: number; dimension: Dimension; foot: Vector3; flash: Vector3; index: number };

export interface VisualStats {
  /** runInterval calls since load. */
  loopStarts: number;
  /** Interval steps since load. */
  loopRuns: number;
  running: boolean;
  queued: number;
  particles: number;
  sounds: number;
  /** Points refused by the engine, e.g. in an unloaded chunk. */
  refused: number;
  /** The tick of the last interval step; -1 before the first. */
  lastRunTick: number;
}

const queue: Burst[] = [];
const stats: VisualStats = { loopStarts: 0, loopRuns: 0, running: false, queued: 0, particles: 0, sounds: 0, refused: 0, lastRunTick: -1 };
let handle: number | undefined;

export function visualStats(): VisualStats {
  return { ...stats, running: handle !== undefined, queued: queue.length };
}

const lerp = (a: Vector3, b: Vector3, k: number): Vector3 => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });

/**
 * Points every LINE_STEP from `from` (excluded: it is the wielder's eye) to `to` (included). A line shorter than one
 * step is its end point alone.
 */
export function linePoints(from: Vector3, to: Vector3): Vector3[] {
  const length = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
  const n = Math.max(1, Math.round(length / LINE_STEP));
  const points: Vector3[] = [];
  for (let i = 1; i <= n; i++) points.push(lerp(from, to, i / n));
  return points;
}

/** A strike's column, top first, ending exactly on `foot`. `index` turns the zigzag so three strikes differ. */
export function strikePoints(foot: Vector3, index: number): Vector3[] {
  const n = Math.round(STRIKE_HEIGHT / STRIKE_STEP);
  const points: Vector3[] = [];
  for (let i = n; i >= 0; i--) {
    const w = i === 0 ? 0 : STRIKE_JITTER * Math.sin(i * 2.1 + index * 1.7);
    const v = i === 0 ? 0 : STRIKE_JITTER * Math.cos(i * 1.3 + index * 2.9);
    points.push({ x: foot.x + w, y: foot.y + i * STRIKE_STEP, z: foot.z + v });
  }
  return points;
}

function particle(dimension: Dimension, id: string, at: Vector3): void {
  try {
    dimension.spawnParticle(id, at);
    stats.particles++;
  } catch {
    // Cosmetic only: a point in an unloaded chunk throws and is skipped.
    stats.refused++;
  }
}

function render(burst: Burst): void {
  if (burst.kind === "line") {
    linePoints(burst.from, burst.to).forEach((p, i) => {
      particle(burst.dimension, SPARK_PARTICLE, p);
      if ((i + 1) % WIND_EVERY === 0) particle(burst.dimension, WIND_PARTICLE, p);
    });
    return;
  }
  for (const p of strikePoints(burst.foot, burst.index)) particle(burst.dimension, SPARK_PARTICLE, p);
  particle(burst.dimension, FLASH_PARTICLE, burst.flash);
  try {
    burst.dimension.playSound(STRIKE_SOUND, burst.foot, { volume: STRIKE_VOLUME });
    stats.sounds++;
  } catch {
    stats.refused++;
  }
}

function step(): void {
  stats.loopRuns++;
  const now = system.currentTick;
  stats.lastRunTick = now;
  for (let i = 0; i < queue.length; ) {
    if (queue[i].due <= now) {
      const [burst] = queue.splice(i, 1);
      render(burst);
    } else {
      i++;
    }
  }
  if (queue.length === 0 && handle !== undefined) {
    system.clearRun(handle);
    handle = undefined;
  }
}

function enqueue(burst: Burst): void {
  queue.push(burst);
  if (handle !== undefined) return;
  handle = system.runInterval(step, 1);
  stats.loopStarts++;
}

/** Queues the wind-and-spark line from the eye to where it ended, drawn once `delay` ticks from now. */
export function drawLine(dimension: Dimension, from: Vector3, to: Vector3, delay: number = LINE_DELAY): void {
  enqueue({ kind: "line", due: system.currentTick + delay, dimension, from: { ...from }, to: { ...to } });
}

/**
 * Queues one strike per entry of `delays` (ticks from now): a spark column down onto `foot`, a flash at `flash` and
 * the impact sound. Coordinates are copied now; a target that moves or dies is never read again.
 */
export function playStrikes(dimension: Dimension, foot: Vector3, flash: Vector3, delays: readonly number[]): void {
  const now = system.currentTick;
  delays.forEach((delay, index) => enqueue({ kind: "strike", due: now + delay, dimension, foot: { ...foot }, flash: { ...flash }, index }));
}
