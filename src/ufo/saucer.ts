// The UFO saucer (L0-sauc): the `andrew:ufo_saucer` entity flown along the UFO
// §2 path by one teleport per UFO tick (L0-sauc-ad02), the beam property the
// client draws the beam bone by (ad01), the §7 sounds, and — when its host
// carries the Orbital seam — the §8 shoot-down (p002, shootdown.ts). The model,
// its spin and the beam's look live in the resource pack; the script never
// rotates it.

import type { Dimension, Entity, Vector3 } from "@minecraft/server";
import type { Interceptor } from "../orbital/flight";
import { OVERWORLD, type UfoDurations } from "./env";
import { EVENT_TAG, type Phase, type PhasePayload, SAUCER_ID, type Saucer, UFO_TAG } from "./event";
import {
  BLAST_PARTICLE,
  SMOKE_PARTICLE,
  type ShootdownHost,
  type ShotRecord,
  fallStep,
  hullHit,
  landingCell,
  rewardAndBroadcast,
  shooterName,
  smokePoints,
} from "./shootdown";

/**
 * UFO §2: horizontal blocks from the centre at spawn and at removal — at most.
 * The engine spawns and moves an entity only in a chunk that is loaded and
 * ticking, and one player on a default server (tick-distance 4) keeps a disc of
 * 57 chunks: 45.75–82.25 blocks out by bearing (ufo_arrival_reach_measured). So
 * each leg is measured when it starts and ends short of the first such chunk.
 */
export const APPROACH_DISTANCE = 90;
/** The saucer stays this far inside the last loaded and ticking chunk column of a leg. */
export const REACH_MARGIN = 1;
/** The arrival tries this many bearings evenly around the random one and takes the longest reach. */
export const ARRIVAL_BEARINGS = 8;
export const CHUNK = 16;
export const LEG_ABOVE_HOVER = 10;
/** L0-adr-ufht: the legs fly at most at ceiling − 4. */
export const LEG_CEILING_MARGIN = 4;
/** Diagnostics only: a dynamic property is visible to the pack that wrote it alone. */
export const EVENT_PROPERTY = "andrew:ufo_event";
/** Client-synced actor properties declared in packs/behavior/entities/ufo_saucer.json. */
export const BEAM_PROPERTY = "andrew:beam";
export const BEAM_LEN_PROPERTY = "andrew:beam_len";
export const BEAM_LEN_MAX = 64;
/** R-sauc-6: the hum's period in the magnet phase; the first one comes this long after magnet-on. */
export const HUM_TICKS = 40;
/** AS-sauc-2: Bedrock attenuates over about 16 × volume blocks, so 4 reaches the ground 40 below. */
export const SOUND_VOLUME = 4;
export const UFO_SOUNDS = { on: "beacon.activate", hum: "beacon.ambient", off: "beacon.deactivate", blast: "random.explode" } as const;
export type UfoSound = (typeof UFO_SOUNDS)[keyof typeof UFO_SOUNDS];
/** P-sauc-1 step 3: in the hover the entity is re-teleported only when it is this far off the point. */
export const HOVER_DRIFT = 0.01;
/**
 * AS-sauc-2 with R-sauc-2: the departure accelerates away over this share of
 * the leg and cruises at 1.5× the mean speed after it — a plain t² would peak
 * at 2× and break the 0.5-block step on a 300-tick leg.
 */
export const DEPART_ACCEL_SHARE = 2 / 3;

export type Leg = "arrival" | "hover" | "departure" | "downed";

export interface FlightPath {
  /** The arrival bearing from the centre; the departure leaves on theta + π. */
  readonly theta: number;
  readonly start: Vector3;
  readonly hover: Vector3;
  readonly end: Vector3;
}

export function legHeight(hoverY: number, ceiling: number): number {
  return Math.min(hoverY + LEG_ABOVE_HOVER, ceiling - LEG_CEILING_MARGIN);
}

/** R-sauc-5: the beam runs from the underside to the centre block. */
export function beamLength(centre: Readonly<Vector3>, hoverY: number): number {
  return Math.min(BEAM_LEN_MAX, Math.max(0, Math.round(hoverY - centre.y)));
}

/** R-sauc-2: in from `theta` at the leg height, `arrive` blocks from the centre's middle; out the opposite way, `depart` blocks. */
export function flightPath(
  centre: Readonly<Vector3>,
  hoverY: number,
  ceiling: number,
  theta: number,
  arrive: number = APPROACH_DISTANCE,
  depart: number = APPROACH_DISTANCE
): FlightPath {
  const hover = { x: centre.x + 0.5, y: hoverY, z: centre.z + 0.5 };
  const start = { x: hover.x + arrive * Math.cos(theta), y: legHeight(hoverY, ceiling), z: hover.z + arrive * Math.sin(theta) };
  return departingTo({ theta, start, hover, end: hover }, depart);
}

/** The same path with its end `depart` blocks out on the bearing opposite the arrival, at the leg height. */
export function departingTo(path: FlightPath, depart: number): FlightPath {
  const { theta, hover, start } = path;
  return { ...path, end: { x: hover.x - depart * Math.cos(theta), y: start.y, z: hover.z - depart * Math.sin(theta) } };
}

/**
 * Blocks from `from` along `theta`, up to `max`, that stay in chunk columns
 * `isTicking` accepts (it is asked at a column's middle): the entry into the first
 * column it refuses, less REACH_MARGIN; 0 when it refuses the first one.
 */
export function tickingReach(isTicking: (at: Vector3) => boolean, from: Readonly<Vector3>, theta: number, max: number): number {
  const dx = Math.cos(theta);
  const dz = Math.sin(theta);
  const column = (cx: number, cz: number): boolean => isTicking({ x: cx * CHUNK + CHUNK / 2, y: from.y, z: cz * CHUNK + CHUNK / 2 });
  let cx = Math.floor(from.x / CHUNK);
  let cz = Math.floor(from.z / CHUNK);
  const sx = dx > 0 ? 1 : -1;
  const sz = dz > 0 ? 1 : -1;
  const flatX = Math.abs(dx) < 1e-12;
  const flatZ = Math.abs(dz) < 1e-12;
  // Distance along the ray to the next column boundary across x and across z.
  let tx = flatX ? Infinity : ((sx > 0 ? (cx + 1) * CHUNK : cx * CHUNK) - from.x) / dx;
  let tz = flatZ ? Infinity : ((sz > 0 ? (cz + 1) * CHUNK : cz * CHUNK) - from.z) / dz;
  const stepX = flatX ? Infinity : CHUNK / Math.abs(dx);
  const stepZ = flatZ ? Infinity : CHUNK / Math.abs(dz);
  if (!column(cx, cz)) return 0;
  for (;;) {
    const t = Math.min(tx, tz);
    if (t >= max) return max;
    const acrossX = tx <= tz;
    const acrossZ = tz <= tx;
    // Through a corner the ray grazes both side columns as well.
    if (acrossX && acrossZ && (!column(cx + sx, cz) || !column(cx, cz + sz))) return Math.max(0, t - REACH_MARGIN);
    if (acrossX) {
      cx += sx;
      tx += stepX;
    }
    if (acrossZ) {
      cz += sz;
      tz += stepZ;
    }
    if (!column(cx, cz)) return Math.max(0, t - REACH_MARGIN);
  }
}

/** The random bearing first, then ARRIVAL_BEARINGS − 1 more around it; the longest reach wins, the earliest on a tie. */
export function arrivalBearing(isTicking: (at: Vector3) => boolean, from: Readonly<Vector3>, theta0: number): { theta: number; reach: number } {
  let best = { theta: theta0, reach: tickingReach(isTicking, from, theta0, APPROACH_DISTANCE) };
  for (let k = 1; k < ARRIVAL_BEARINGS && best.reach < APPROACH_DISTANCE; k++) {
    const theta = theta0 + (2 * Math.PI * k) / ARRIVAL_BEARINGS;
    const reach = tickingReach(isTicking, from, theta, APPROACH_DISTANCE);
    if (reach > best.reach) best = { theta, reach };
  }
  return best;
}

/** A throw reads as not ticking: the leg then stops short of that column. */
export const tickingIn =
  (dim: Pick<Dimension, "isChunkLoaded">) =>
  (at: Vector3): boolean => {
    try {
      return dim.isChunkLoaded(at);
    } catch {
      return false;
    }
  };

const clamp01 = (k: number): number => Math.min(1, Math.max(0, k));

export function smoothstep(k: number): number {
  const u = clamp01(k);
  return u * u * (3 - 2 * u);
}

export function departEase(k: number): number {
  const u = clamp01(k);
  const a = DEPART_ACCEL_SHARE;
  const cruise = 1 / (1 - a / 2);
  return u < a ? (cruise / (2 * a)) * u * u : cruise * (a / 2 + (u - a));
}

const lerp = (a: Vector3, b: Vector3, k: number): Vector3 => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });

/**
 * Where the saucer is `t` UFO ticks into a moving leg. The core steps the
 * arrival for t = 1 … D−1 and turns the magnet on at t = D, so the arrival meets
 * the hover point exactly then; it steps the departure for t = 1 … D and
 * removes the saucer the tick after, so the last step lands on `end`.
 */
export function legPosition(path: FlightPath, leg: "arrival" | "departure", t: number, durations: UfoDurations): Vector3 {
  return leg === "arrival" ? lerp(path.start, path.hover, smoothstep(t / durations.arrival)) : lerp(path.hover, path.end, departEase(t / durations.departure));
}

/** R-sauc-6: the one place a UFO sound is played. */
export function playUfoSound(dim: Dimension, id: UfoSound, at: Vector3): void {
  dim.playSound(id, at, { volume: SOUND_VOLUME });
}

export interface SaucerHost {
  overworld(): Dimension;
  random(): number;
  readonly durations: UfoDurations;
  ceiling(): number;
  /** Stands in for playUfoSound, so a GameTest can count the calls. */
  sound?(id: UfoSound, at: Vector3): void;
  /** The Orbital hull and the shoot-down; a saucer without it cannot be shot. */
  shootdown?: ShootdownHost;
  /** Where the measured legs are reported. */
  log?(msg: string): void;
}

export interface UfoSaucer extends Saucer {
  entity(): Entity | undefined;
  legs(): FlightPath | undefined;
  leg(): Leg | undefined;
  beamOn(): boolean;
  /** This event's shoot-down, from the latch on. */
  shot(): Readonly<ShotRecord> | undefined;
}

const fmt = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
const degrees = (theta: number): string => (((((theta * 180) / Math.PI) % 360) + 360) % 360).toFixed(1);
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** Unloaded reads as air: the fall goes on, and the step cap still ends it. */
function airAt(dim: Dimension, x: number, y: number, z: number): boolean {
  try {
    return dim.getBlock({ x, y, z })?.isAir !== false;
  } catch {
    return true;
  }
}

export function createSaucer(host: SaucerHost): UfoSaucer {
  let entity: Entity | undefined;
  let path: FlightPath | undefined;
  let leg: Leg | undefined;
  /** UFO ticks stepped in the current leg. */
  let t = 0;
  /** Where the saucer was last put; what saucerPosition() reports (L0-sauc-ent2). */
  let pos: Vector3 | undefined;
  /** The magnet is on: the hum and the magnet-off sound follow this. */
  let beam = false;
  /** The value last written to BEAM_PROPERTY. */
  let shown = false;
  let eventId: string | undefined;
  let shot: ShotRecord | undefined;
  let unregister: (() => void) | undefined;
  const sd = host.shootdown;

  const valid = (): Entity | undefined => (entity?.isValid === true ? entity : undefined);

  const play = (id: UfoSound, at: Vector3): void => {
    if (host.sound !== undefined) host.sound(id, at);
    else playUfoSound(host.overworld(), id, at);
  };

  const sound = (id: UfoSound): void => {
    if (pos === undefined || valid() === undefined) return;
    play(id, pos);
  };

  const disarm = (): void => {
    unregister?.();
    unregister = undefined;
  };

  /**
   * P-sauc-2 steps 6–9, once per shot: on the ground, at the step cap, or —
   * when the event ends first — at the last known position. Tied to the latch,
   * not to the entity.
   */
  const blast = (by: "ground" | "cap" | "end"): void => {
    if (sd === undefined || shot === undefined || shot.blasted || pos === undefined) return;
    shot.blasted = true;
    shot.blastBy = by;
    disarm();
    const at = { ...pos };
    shot.blastAt = at;
    const dim = host.overworld();
    try {
      dim.spawnParticle(BLAST_PARTICLE, at);
    } catch (err) {
      sd.log(`ufo ${shot.eventId}: the blast particle threw ${errText(err)}`);
    }
    try {
      play(UFO_SOUNDS.blast, at);
    } catch (err) {
      sd.log(`ufo ${shot.eventId}: the blast sound threw ${errText(err)}`);
    }
    rewardAndBroadcast(dim, at, shot, sd);
    valid()?.remove();
    sd.log(
      `ufo ${shot.eventId}: blast (${by}) at ${fmt(at)} after ${shot.steps} fall steps; ${shot.absorbed} charge(s) absorbed, ` +
        `${shot.rewards} reward stack(s), broadcast to ${shot.told} naming ${shot.ownerName}`
    );
  };

  /** P-sauc-2 step 5: one tick of the smoking fall. */
  const fall = (): void => {
    if (shot === undefined || shot.blasted || pos === undefined) return;
    shot.steps++;
    const e = valid();
    if (e === undefined) {
      blast("end");
      return;
    }
    const dim = host.overworld();
    const next = fallStep(pos.y, shot.vy);
    shot.vy = next.vy;
    const { x, z } = pos;
    const cell = landingCell(pos.y, next.y, dim.heightRange.min, (y) => airAt(dim, Math.floor(x), y, Math.floor(z)));
    pos = { x, y: cell === undefined ? next.y : cell + 1, z };
    e.teleport(pos);
    if (cell !== undefined) {
      blast("ground");
      return;
    }
    try {
      for (const at of smokePoints(pos, shot.steps)) dim.spawnParticle(SMOKE_PARTICLE, at);
    } catch (err) {
      if (shot.steps === 1) sd?.log(`ufo ${shot.eventId}: the smoke threw ${errText(err)}`);
    }
    if (shot.steps >= host.durations.downed) blast("cap");
  };

  /** P-sauc-2 steps 1–4: the first crossing latches; the rest are absorbed silently (R-sauc-4 item 1, AS-sauc-5). */
  const intercept: Interceptor = (attack, _charge, from, to, tick) => {
    if (sd === undefined || attack.dimensionId !== OVERWORLD || eventId === undefined) return false;
    const at = valid() === undefined ? undefined : pos;
    if (at === undefined || shot?.blasted === true || !hullHit(at, from, to)) return false;
    if (shot !== undefined) {
      shot.absorbed++;
      return true;
    }
    const ownerName = shooterName(attack, sd.players());
    shot = {
      eventId,
      ownerId: attack.ownerId,
      ownerName,
      attackId: attack.attackId,
      tick,
      leg: leg ?? "none",
      at: { ...at },
      absorbed: 1,
      vy: 0,
      steps: 0,
      blasted: false,
      blastAt: undefined,
      blastBy: undefined,
      told: 0,
      rewards: 0,
    };
    sd.log(`ufo ${eventId}: shot down by ${ownerName} (attack ${attack.attackId}) at ${fmt(at)} in the ${shot.leg} leg`);
    const core = sd.core();
    if (core === undefined) {
      sd.log(`ufo ${eventId}: no core to report the shot to`);
      return true;
    }
    try {
      core.requestMagnetOff("shot");
      core.reportShotDown({ eventId, ownerId: attack.ownerId, ownerName });
    } catch (err) {
      sd.log(`ufo ${eventId}: reporting the shot threw ${errText(err)}`);
    }
    return true;
  };

  // setProperty lands a tick after the call, so the two flips the schedule
  // foresees are written in the step before them; a stop, an abort or a shot
  // is written in its own tick and shows one tick late.
  const show = (on: boolean): void => {
    if (shown === on) return;
    shown = on;
    valid()?.setProperty(BEAM_PROPERTY, on);
  };

  const reset = (): void => {
    disarm();
    if (entity?.isValid === true) entity.remove();
    entity = undefined;
    path = undefined;
    leg = undefined;
    pos = undefined;
    beam = false;
    shown = false;
    t = 0;
    eventId = undefined;
    shot = undefined;
  };

  const spawn = (p: PhasePayload): void => {
    reset();
    const dim = host.overworld();
    const ceiling = host.ceiling();
    const from = { x: p.centre.x + 0.5, y: legHeight(p.hoverY, ceiling), z: p.centre.z + 0.5 };
    const { theta, reach } = arrivalBearing(tickingIn(dim), from, host.random() * 2 * Math.PI);
    path = flightPath(p.centre, p.hoverY, ceiling, theta, reach);
    host.log?.(`ufo ${p.eventId}: saucer in from ${reach.toFixed(2)} blocks at ${degrees(theta)}° — the loaded and ticking reach, at most ${APPROACH_DISTANCE}`);
    // Throws where the chunk is not loaded and ticking; with no saucer the core ends the event (L0-ufoc-as04).
    const spawned = dim.spawnEntity(SAUCER_ID, path.start);
    spawned.addTag(UFO_TAG);
    spawned.addTag(EVENT_TAG + p.eventId);
    spawned.setDynamicProperty(EVENT_PROPERTY, p.eventId);
    spawned.setProperty(BEAM_LEN_PROPERTY, beamLength(p.centre, p.hoverY));
    entity = spawned;
    pos = path.start;
    leg = "arrival";
    eventId = p.eventId;
    if (sd !== undefined) unregister = sd.registerInterceptor(intercept);
  };

  return {
    onPhase(phase: Phase, p: PhasePayload): void {
      switch (phase) {
        case "arrival":
          spawn(p);
          return;
        case "magnet":
          if (path === undefined) return;
          leg = "hover";
          t = 0;
          pos = path.hover;
          beam = true;
          show(true);
          sound(UFO_SOUNDS.on);
          return;
        case "release":
          if (!beam) return;
          beam = false;
          show(false);
          sound(UFO_SOUNDS.off);
          return;
        case "departure": {
          leg = "departure";
          t = 0;
          if (path === undefined) return;
          const out = tickingReach(tickingIn(host.overworld()), { ...path.hover, y: path.start.y }, path.theta + Math.PI, APPROACH_DISTANCE);
          path = departingTo(path, out);
          host.log?.(`ufo ${p.eventId}: saucer out to ${out.toFixed(2)} blocks — the loaded and ticking reach, at most ${APPROACH_DISTANCE}`);
          return;
        }
        case "downed":
          leg = "downed";
          t = 0;
          // Shot in the step that wrote the beam ahead of a magnet that now never comes.
          if (!beam) show(false);
          return;
        case "pause":
          // ufsd §3: an event that ends before the blast still gets it, once.
          if (shot !== undefined && !shot.blasted) blast("end");
          reset();
          return;
      }
    },

    saucerStep(): void {
      if (leg === "downed") {
        fall();
        return;
      }
      const e = valid();
      if (e === undefined || path === undefined || leg === undefined) return;
      t++;
      if (leg === "arrival" || leg === "departure") {
        pos = legPosition(path, leg, t, host.durations);
        e.teleport(pos);
        if (leg === "arrival" && t === host.durations.arrival - 1) show(true);
      } else if (leg === "hover") {
        const at = e.location;
        if (t === 1 || Math.hypot(at.x - path.hover.x, at.y - path.hover.y, at.z - path.hover.z) > HOVER_DRIFT) e.teleport(path.hover);
        pos = path.hover;
        if (beam && t > 1 && (t - 1) % HUM_TICKS === 0) sound(UFO_SOUNDS.hum);
        if (t === host.durations.magnet) show(false);
      }
    },

    saucerPosition(): Vector3 | undefined {
      return valid() === undefined ? undefined : pos;
    },

    fallFinished(): boolean {
      return shot?.blasted === true;
    },

    entity: valid,
    legs: () => path,
    leg: () => leg,
    beamOn: () => beam,
    shot: () => shot,
  };
}
