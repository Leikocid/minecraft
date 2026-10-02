// The saucer until L0-sauc ships: the §2 path in straight lines — in from 90
// blocks out at hover + 10, held at the hover point through the magnet, out the
// opposite way — and removed at the pause. No model, beam, sound or shoot-down.

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

export interface StubSaucerHost {
  overworld(): Dimension;
  random(): number;
  readonly durations: UfoDurations;
  ceiling(): number;
}

export interface StubSaucer extends Saucer {
  entity(): Entity | undefined;
  /** Where the arrival leg starts and the departure leg ends. */
  legs(): { start: Vector3; hover: Vector3; end: Vector3 } | undefined;
}

const lerp = (a: Vector3, b: Vector3, k: number): Vector3 => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, z: a.z + (b.z - a.z) * k });

export function legHeight(hoverY: number, ceiling: number): number {
  return Math.min(hoverY + LEG_ABOVE_HOVER, ceiling - LEG_CEILING_MARGIN);
}

export function createStubSaucer(host: StubSaucerHost): StubSaucer {
  let entity: Entity | undefined;
  let phase: Phase = "pause";
  let t = 0;
  let path: { start: Vector3; hover: Vector3; end: Vector3 } | undefined;

  const removeEntity = (): void => {
    if (entity?.isValid === true) entity.remove();
    entity = undefined;
  };

  return {
    onPhase(next: Phase, p: PhasePayload): void {
      if (next === "release") return;
      phase = next;
      t = 0;
      if (next === "arrival") {
        removeEntity();
        const theta = host.random() * 2 * Math.PI;
        const hover = { x: p.centre.x + 0.5, y: p.hoverY, z: p.centre.z + 0.5 };
        const y = legHeight(p.hoverY, host.ceiling());
        const dx = APPROACH_DISTANCE * Math.cos(theta);
        const dz = APPROACH_DISTANCE * Math.sin(theta);
        path = { start: { x: hover.x + dx, y, z: hover.z + dz }, hover, end: { x: hover.x - dx, y, z: hover.z - dz } };
        // Throws in an unloaded chunk; the core then aborts the event (L0-ufoc-as04).
        const spawned = host.overworld().spawnEntity(SAUCER_ID, path.start);
        spawned.addTag(UFO_TAG);
        spawned.addTag(EVENT_TAG + p.eventId);
        spawned.setDynamicProperty(EVENT_PROPERTY, p.eventId);
        entity = spawned;
      } else if (next === "pause") {
        removeEntity();
        path = undefined;
      }
    },

    saucerStep(): void {
      if (entity?.isValid !== true || path === undefined) return;
      t++;
      const D = host.durations;
      if (phase === "arrival") entity.teleport(lerp(path.start, path.hover, Math.min(1, t / D.arrival)));
      else if (phase === "magnet") entity.teleport(path.hover);
      else if (phase === "departure") entity.teleport(lerp(path.hover, path.end, Math.min(1, t / D.departure)));
    },

    saucerPosition(): Vector3 | undefined {
      return entity?.isValid === true ? entity.location : undefined;
    },

    entity: () => (entity?.isValid === true ? entity : undefined),
    legs: () => path,
  };
}
