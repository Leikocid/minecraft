// Where a charge appears (L0-orbc-r007, L0-orbc-as01, L0-orbc-as04) and the
// spawn itself (L0-orbc-p002 "Spawn"). Type-only engine imports, so the pure
// part is unit-tested in node.

import type { Dimension, Entity, Vector3 } from "@minecraft/server";
import { CHARGE_ENTITY_ID, CHARGE_TAG, type Column, SCALE_SPAWN_EVENTS, attackTag } from "./charge";

/**
 * Height above the target block, per dimension id (§8, amended by
 * decision-aim-range-25-and-spawn-height-60). At FALL_SPEED = 1 block a tick the
 * offset is also the fuse: 60 blocks give the shooter 3 seconds to leave the
 * field, 30 gave 1.5 and no escape existed. The Nether keeps 10 — its ceiling at
 * 128 leaves nowhere to fall from, so there the aim range is the only lever.
 */
export const SPAWN_OFFSET: Readonly<Record<string, number>> = {
  "minecraft:overworld": 60,
  "minecraft:the_end": 60,
  "minecraft:nether": 10,
};

/** Any dimension missing from SPAWN_OFFSET. */
export const DEFAULT_SPAWN_OFFSET = 60;

/**
 * Feet Y of every charge of an attack locked on a block at `targetY`.
 * `heightRange.max` is the first Y above the build limit, so `max − 1` is the
 * highest cell; there is no lower clamp.
 */
export function spawnY(dimensionId: string, targetY: number, heightRange: { max: number }): number {
  return Math.min(targetY + (SPAWN_OFFSET[dimensionId] ?? DEFAULT_SPAWN_OFFSET), heightRange.max - 1);
}

/** The column centre at `y`. */
export function chargeLocation(column: Column, y: number): Vector3 {
  return { x: column.x + 0.5, y, z: column.z + 0.5 };
}

/** One charge entity, tagged with its attack; an untagged one is never left behind. */
export function spawnCharge(dim: Dimension, column: Column, y: number, attackId: string, scale: 0 | 1): Entity {
  const entity = dim.spawnEntity(CHARGE_ENTITY_ID, chargeLocation(column, y), { spawnEvent: SCALE_SPAWN_EVENTS[scale] });
  try {
    entity.addTag(CHARGE_TAG);
    entity.addTag(attackTag(attackId));
  } catch (err) {
    entity.remove();
    throw err;
  }
  return entity;
}
