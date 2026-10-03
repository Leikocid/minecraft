// The UFO saucer (L0-sauc): the `andrew:ufo_saucer` entity flown along the UFO
// §2 path by one teleport per UFO tick (L0-sauc-ad02), the beam property the
// client draws the beam bone by (ad01), and the §7 sounds. The model, its spin
// and the beam's look live in the resource pack; the script never rotates it.

import type { Dimension, Entity, Vector3 } from "@minecraft/server";
import type { UfoDurations } from "./env";
import { EVENT_TAG, type Phase, type PhasePayload, SAUCER_ID, type Saucer, UFO_TAG } from "./event";

/** UFO §2: horizontal blocks from the centre at spawn and at removal. */
export const APPROACH_DISTANCE = 90;
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
export const UFO_SOUNDS = { on: "beacon.activate", hum: "beacon.ambient", off: "beacon.deactivate" } as const;
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

/** R-sauc-2: in from `theta` at the leg height, out the opposite way, both APPROACH_DISTANCE from the centre's middle. */
export function flightPath(centre: Readonly<Vector3>, hoverY: number, ceiling: number, theta: number): FlightPath {
  const hover = { x: centre.x + 0.5, y: hoverY, z: centre.z + 0.5 };
  const y = legHeight(hoverY, ceiling);
  const dx = APPROACH_DISTANCE * Math.cos(theta);
  const dz = APPROACH_DISTANCE * Math.sin(theta);
  return { theta, start: { x: hover.x + dx, y, z: hover.z + dz }, hover, end: { x: hover.x - dx, y, z: hover.z - dz } };
}

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
}

export interface UfoSaucer extends Saucer {
  entity(): Entity | undefined;
  legs(): FlightPath | undefined;
  leg(): Leg | undefined;
  beamOn(): boolean;
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

  const valid = (): Entity | undefined => (entity?.isValid === true ? entity : undefined);

  const sound = (id: UfoSound): void => {
    if (pos === undefined || valid() === undefined) return;
    if (host.sound !== undefined) host.sound(id, pos);
    else playUfoSound(host.overworld(), id, pos);
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
    if (entity?.isValid === true) entity.remove();
    entity = undefined;
    path = undefined;
    leg = undefined;
    pos = undefined;
    beam = false;
    shown = false;
    t = 0;
  };

  const spawn = (p: PhasePayload): void => {
    reset();
    path = flightPath(p.centre, p.hoverY, host.ceiling(), host.random() * 2 * Math.PI);
    // Throws in an unloaded chunk; the core then aborts the event (L0-ufoc-as04).
    const spawned = host.overworld().spawnEntity(SAUCER_ID, path.start);
    spawned.addTag(UFO_TAG);
    spawned.addTag(EVENT_TAG + p.eventId);
    spawned.setDynamicProperty(EVENT_PROPERTY, p.eventId);
    spawned.setProperty(BEAM_LEN_PROPERTY, beamLength(p.centre, p.hoverY));
    entity = spawned;
    pos = path.start;
    leg = "arrival";
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
        case "departure":
          leg = "departure";
          t = 0;
          return;
        case "downed":
          leg = "downed";
          t = 0;
          // Shot in the step that wrote the beam ahead of a magnet that now never comes.
          if (!beam) show(false);
          return;
        case "pause":
          reset();
          return;
      }
    },

    saucerStep(): void {
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

    entity: valid,
    legs: () => path,
    leg: () => leg,
    beamOn: () => beam,
  };
}
