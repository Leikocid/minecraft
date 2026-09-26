// The one table of per-chunk chances and roll order (L0-strf-r002, L0-xq2),
// plus the discovery and job budget knobs (L0-strf-p001, L0-strf-p005).

import type { DimShort, Vec3 } from "./registry";

export type StructureId = "windmill" | "airship" | "warden_city" | "bastion";

export interface RollDef {
  /** Part of the roll hash: renaming it moves every structure of this kind. */
  id: StructureId;
  dim: DimShort;
  chance: number;
  /** Unrotated template size x, y, z; x and z swap for rotations 1 and 3. */
  size: Vec3;
}

/** §4.6, §5.5, §13.2, §14.2. */
export const CHANCES: Readonly<Record<StructureId, number>> = {
  windmill: 0.01,
  airship: 0.02,
  warden_city: 0.05,
  bastion: 0.05,
};

/**
 * Array order is the order within a chunk: a later def sees the records of the
 * earlier ones and is cancelled if it collides with them.
 */
export const ROLL_DEFS: readonly RollDef[] = [
  { id: "windmill", dim: "o", chance: CHANCES.windmill, size: [35, 30, 35] },
  { id: "airship", dim: "o", chance: CHANCES.airship, size: [15, 7, 12] },
  { id: "warden_city", dim: "o", chance: CHANCES.warden_city, size: [30, 15, 30] },
  { id: "bastion", dim: "n", chance: CHANCES.bastion, size: [20, 12, 20] },
];

/** The End and every custom dimension map to undefined: nothing rolls there. */
export function dimShort(dimensionId: string): DimShort | undefined {
  if (dimensionId === "minecraft:overworld") return "o";
  if (dimensionId === "minecraft:nether") return "n";
  return undefined;
}

/** Chunks around a player; 4 sits inside the BDS default simulation distance. */
export const R_DISCOVER = 4;

export const DISCOVER_INTERVAL_TICKS = 20;

/** Past this many queued chunks the oldest are dropped unmarked, and rediscovered later. */
export const QUEUE_LIMIT = 2048;

/** A job slice yields once it has run this long; checked between chunks. */
export const SLICE_BUDGET_MS = 5;

/**
 * Hard ceiling for one slice: the yield threshold plus one chunk's worth of
 * overrun. A slice over it is a failure, not a warning.
 */
export const SLICE_CEILING_MS = 10;
