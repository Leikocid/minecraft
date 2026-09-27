// The one table of per-chunk chances and roll order (L0-strf-r002, L0-xq2),
// plus the discovery and job budget knobs (L0-strf-p001, L0-strf-p005).

import type { DimShort, Vec3 } from "./registry";
import type { KeyValueStore } from "./store";
import { AIRSHIP_SIZE } from "./templates/airship";
import { BASTION_SIZE } from "./templates/bastion";
import { WARDEN_CITY_SIZE } from "./templates/warden-city";
import { WINDMILL_SIZE } from "./templates/windmill";

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
  { id: "windmill", dim: "o", chance: CHANCES.windmill, size: [...WINDMILL_SIZE] },
  { id: "airship", dim: "o", chance: CHANCES.airship, size: [...AIRSHIP_SIZE] },
  { id: "warden_city", dim: "o", chance: CHANCES.warden_city, size: [...WARDEN_CITY_SIZE] },
  { id: "bastion", dim: "n", chance: CHANCES.bastion, size: [...BASTION_SIZE] },
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

/** World dynamic property holding the enabled types, comma-separated. */
export const ENABLED_KEY = "andrew:st:enabled";

/**
 * Which types may roll and be used by `/andrew:structure`, kept in the world so
 * one pack serves every server. Without a stored value `fallback` applies: the
 * release script passes none (nothing enabled until the operator says so);
 * harnesses that build their own runtime default to every type.
 */
export class EnabledTypes {
  constructor(
    private readonly store: KeyValueStore,
    private readonly fallback: readonly StructureId[] = []
  ) {}

  /** In roll-table order; unknown names in the stored value are dropped. */
  list(): StructureId[] {
    const raw = this.store.get(ENABLED_KEY);
    const named = raw === undefined ? this.fallback : raw.split(",");
    return ROLL_DEFS.map((d) => d.id).filter((id) => named.includes(id));
  }

  has(type: string): boolean {
    return (this.list() as string[]).includes(type);
  }

  enable(types: readonly StructureId[]): StructureId[] {
    return this.write([...this.list(), ...types]);
  }

  disable(types: readonly StructureId[]): StructureId[] {
    return this.write(this.list().filter((t) => !types.includes(t)));
  }

  /** An empty set is stored as "", not deleted: disabling everything must outlive a change of `fallback`. */
  private write(types: readonly StructureId[]): StructureId[] {
    this.store.set(ENABLED_KEY, ROLL_DEFS.map((d) => d.id).filter((id) => types.includes(id)).join(","));
    return this.list();
  }
}

/** The load-time log line: what this world lets generate. */
export const enabledLine = (enabled: readonly StructureId[]): string =>
  `structures enabled: ${enabled.length === 0 ? "none (nothing generates until /andrew:structure enable)" : enabled.join(",")}`;
