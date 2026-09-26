// The one template-local → world transform (L0-strf-r004). Pure, so node tests
// bundle it without a @minecraft/server stub.
//
// Probe Q2 (BDS 1.26.51.1): structureManager.place rotates block positions and
// block states correctly, and the given location stays the min corner of the
// rotated AABB at 0/90/180/270. Everything below relies on that convention.

import type { Rotation, Vec3 } from "./registry";

export const ROTATIONS: readonly Rotation[] = [0, 1, 2, 3];

/** Value of the engine's StructureRotation enum for each rotation, clockwise seen from above. */
export const ENGINE_ROTATION = ["None", "Rotate90", "Rotate180", "Rotate270"] as const;
export type EngineRotation = (typeof ENGINE_ROTATION)[number];

/** Size of the rotated AABB; x and z swap for 90 and 270. Its own inverse. */
export const rotatedSize = (size: Vec3, rot: Rotation): Vec3 =>
  rot % 2 === 0 ? [size[0], size[1], size[2]] : [size[2], size[1], size[0]];

/** Offset of a template-local point inside the rotated AABB; `size` is the unrotated template size. */
export function rotateLocal(p: Vec3, size: Vec3, rot: Rotation): Vec3 {
  switch (rot) {
    case 1:
      return [size[2] - 1 - p[2], p[1], p[0]];
    case 2:
      return [size[0] - 1 - p[0], p[1], size[2] - 1 - p[2]];
    case 3:
      return [p[2], p[1], size[0] - 1 - p[0]];
    default:
      return [p[0], p[1], p[2]];
  }
}

/** World position of a template-local point of a structure placed at `origin` (min corner). */
export const toWorld = (origin: Vec3, p: Vec3, size: Vec3, rot: Rotation): Vec3 => {
  const o = rotateLocal(p, size, rot);
  return [origin[0] + o[0], origin[1] + o[1], origin[2] + o[2]];
};

const CARDINALS = ["north", "east", "south", "west"] as const;

/** A horizontal facing after rotation; anything that is not a cardinal is returned unchanged. */
export function rotateCardinal(dir: string, rot: Rotation): string {
  const i = CARDINALS.indexOf(dir as (typeof CARDINALS)[number]);
  return i < 0 ? dir : CARDINALS[(i + rot) % 4];
}
