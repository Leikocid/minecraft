// Underwater Bow flight, the part that needs no engine (spec §1; L0-uwbw-adfl, L0-uwbw-a003, C-42):
// the liquid inertia the bow's arrow gets, the air path it must keep, and the judgement that decides
// whether a flight through water or lava is air-like. Numbers cite docs/feedback/probe-ubow.md §2.

export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export const ARROW_ID = "minecraft:arrow";
/** Marks an arrow the bow fired. A tag is saved with the entity; the inertia write may not be. */
export const FLIGHT_TAG = "andrew:ubow_arrow";
/**
 * Marks an arrow an Infinity copy of the bow fired. A custom shooter's Infinity arrow can be picked up
 * (probe §3: 64 → 65), where the vanilla bow's gives nothing; the bow takes it off when it lands.
 */
export const INFINITY_TAG = "andrew:ubow_infinity";
export const INFINITY = "infinity";

/** The vanilla arrow's air drag per tick as the runtime reads it (probe §2: airInertia 0.990). */
export const AIR_INERTIA = 0.99;
/** The vanilla arrow's gravity per tick (probe §2: 0.050). */
export const GRAVITY = 0.05;
/** The vanilla arrow's liquid_inertia as the runtime reads it: water keeps 60 % of the speed a tick (probe §2). */
export const VANILLA_LIQUID_INERTIA = 0.6;

/**
 * A vanilla arrow flies this far below the location its entitySpawn reports: the projectile's
 * `offset` [0, −0.1, 0]. On BDS every air flight sits 0.10 off the air model at every tick.
 */
export const SPAWN_OFFSET_Y = -0.1;

/** C-42: in water and lava the bow's arrow keeps its air speed and distance within ± 10 %. */
export const AIR_TOLERANCE = 0.1;
/** AC-uwbw-003: an arrow without the bow's handling covers under half the air distance in the same water. */
export const SLOWED_CEILING = 0.5;

/**
 * A full-draw vanilla arrow's hit: the base ⌈2·v⌉ at 2.95–3.05 b/t is 6 or 7 and the crit adds up to
 * base / 2 + 2 on top (probe §3: 6.05–12.08 over the bow, the tagged bow and the custom shooter).
 */
export const FULL_DRAW_DAMAGE = { min: 6, max: 12.5 } as const;
/** A 12-tick draw launches at 1.54–1.58 b/t and hits for exactly ⌈2·v⌉ = 4, with no crit (probe §3). */
export const PARTIAL_DRAW_TICKS = 12;
export const PARTIAL_DRAW_DAMAGE = 4;

/**
 * The liquid inertia that makes a liquid tick an air tick: the arrow's own air inertia. An unreadable or
 * out-of-range air value falls back to the vanilla arrow's 0.99 rather than freezing or accelerating it.
 */
export function liquidInertiaFor(airInertia: number | undefined): number {
  if (airInertia === undefined || !Number.isFinite(airInertia) || airInertia <= 0 || airInertia > 1) return AIR_INERTIA;
  return airInertia;
}

/** One air tick: the entity moves by its velocity, then drag scales the velocity and gravity pulls y. */
export function airStep(v: Vec3, drag = AIR_INERTIA, gravity = GRAVITY): Vec3 {
  return { x: v.x * drag, y: v.y * drag - gravity, z: v.z * drag };
}

export interface PathPoint {
  /** Displacement from the spawn point. */
  readonly at: Vec3;
  /** The velocity the arrow carries out of this point. */
  readonly v: Vec3;
}

/**
 * The air path from a spawn velocity, `ticks` + 1 points: index 0 is the spawn point. Matches the
 * probe's scripted air arrow to the hundredth (3.00 5.97 8.91 … forward, 0.74 down at +6).
 */
export function airPath(v0: Vec3, ticks: number, drag = AIR_INERTIA, gravity = GRAVITY): PathPoint[] {
  const out: PathPoint[] = [{ at: { x: 0, y: 0, z: 0 }, v: v0 }];
  let at: Vec3 = { x: 0, y: 0, z: 0 };
  let v = v0;
  for (let t = 1; t <= ticks; t++) {
    at = { x: at.x + v.x, y: at.y + v.y, z: at.z + v.z };
    v = airStep(v, drag, gravity);
    out.push({ at, v });
  }
  return out;
}

export const horizontal = (v: Vec3): number => Math.hypot(v.x, v.z);
export const speed = (v: Vec3): number => Math.hypot(v.x, v.y, v.z);

/**
 * How far the air path runs, horizontally, before it has fallen `height` below its start; linear
 * between ticks. Undefined when it has not fallen that far within `maxTicks`.
 */
export function landingRun(v0: Vec3, height: number, maxTicks = 400): number | undefined {
  const path = airPath(v0, maxTicks);
  for (let t = 1; t < path.length; t++) {
    const a = path[t - 1].at;
    const b = path[t].at;
    if (b.y > -height) continue;
    const k = a.y === b.y ? 1 : (-height - a.y) / (b.y - a.y);
    return horizontal({ x: a.x + (b.x - a.x) * k, y: 0, z: a.z + (b.z - a.z) * k });
  }
  return undefined;
}

export function ratio(got: number, want: number): number {
  return want === 0 ? (got === 0 ? 1 : Number.POSITIVE_INFINITY) : got / want;
}

export function within(got: number, want: number, tolerance = AIR_TOLERANCE): boolean {
  return Number.isFinite(got) && Number.isFinite(want) && Math.abs(ratio(got, want) - 1) <= tolerance;
}

/** What a scenario sampled of one arrow: displacement and velocity by tick since spawn, and where it stuck. */
export interface Flight {
  readonly samples: ReadonlyMap<number, PathPoint>;
  /** Horizontal distance from spawn to the block hit; undefined if the arrow never hit one. */
  readonly landing?: number;
}

/**
 * The flight an arrow launched at `v0` makes through air, sampled at ticks 0..`ticks`, landing on a
 * floor `height` below its line of flight. A sim player's aim wavers by a few hundredths of a block per
 * tick, which moves a landing by several percent, so a shot's range is judged against this, its own
 * air flight, rather than against another shot's.
 */
export function airFlight(v0: Vec3, ticks: number, height?: number): Flight {
  const path = airPath(v0, ticks);
  return { samples: new Map(path.map((p, t) => [t, p])), landing: height === undefined ? undefined : landingRun(v0, height) };
}

export interface Comparison {
  /** Ticks compared, each present in both flights. */
  readonly ticks: readonly number[];
  /** Horizontal run of the flight over the reference's, per compared tick. */
  readonly run: readonly number[];
  /** Speed of the flight over the reference's, per compared tick. */
  readonly speed: readonly number[];
  /** Landing distance over the reference's; undefined if either never landed. */
  readonly landing?: number;
}

/** Compares `flight` with `reference` at the asked ticks both of them were sampled at. */
export function compare(flight: Flight, reference: Flight, ticks: readonly number[]): Comparison {
  const both = ticks.filter((t) => flight.samples.has(t) && reference.samples.has(t));
  const pick = (f: Flight, t: number): PathPoint => f.samples.get(t) as PathPoint;
  return {
    ticks: both,
    run: both.map((t) => ratio(horizontal(pick(flight, t).at), horizontal(pick(reference, t).at))),
    speed: both.map((t) => ratio(speed(pick(flight, t).v), speed(pick(reference, t).v))),
    landing: flight.landing === undefined || reference.landing === undefined ? undefined : ratio(flight.landing, reference.landing),
  };
}

/**
 * Why a comparison is not air-like (C-42), one line per failed measure; empty when it is. It needs at
 * least `minTicks` compared ticks and, if `needLanding`, a landing ratio: a flight that was not
 * sampled proves nothing.
 */
export function airLikeFailures(c: Comparison, opts: { tolerance?: number; minTicks?: number; needLanding?: boolean } = {}): string[] {
  const tolerance = opts.tolerance ?? AIR_TOLERANCE;
  const out: string[] = [];
  if (c.ticks.length < (opts.minTicks ?? 3)) out.push(`only ${c.ticks.length} tick(s) sampled in both flights`);
  const off = (r: number): boolean => !Number.isFinite(r) || Math.abs(r - 1) > tolerance;
  c.ticks.forEach((t, i) => {
    if (off(c.run[i])) out.push(`run at +${t} is ${c.run[i].toFixed(2)} of the air run`);
    if (off(c.speed[i])) out.push(`speed at +${t} is ${c.speed[i].toFixed(2)} of the air speed`);
  });
  if (c.landing === undefined) {
    if (opts.needLanding === true) out.push("no landing to compare");
  } else if (off(c.landing)) {
    out.push(`landing is ${c.landing.toFixed(2)} of the air landing`);
  }
  return out;
}

/**
 * Whether a flight is clearly slowed: its run at the last compared tick, or failing that its landing,
 * is under `ceiling` of the reference's. Used for the controls that must go red.
 */
export function isSlowed(c: Comparison, ceiling = SLOWED_CEILING): boolean {
  const last = c.run[c.run.length - 1];
  if (last !== undefined) return last < ceiling;
  return c.landing !== undefined && c.landing < ceiling;
}

/** Whether a full-draw hit is a vanilla bow hit: inside the measured envelope, so no bonus rides on the flight. */
export function isVanillaFullDraw(damage: number): boolean {
  return Number.isFinite(damage) && damage >= FULL_DRAW_DAMAGE.min && damage <= FULL_DRAW_DAMAGE.max;
}
