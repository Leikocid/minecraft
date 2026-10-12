// The world-wide ticking-area budget (L0-adr-prta, L0-pear-ad01, CX-pear-01): one counter per script pack that every
// product client of `/tickingarea add` asks before adding and tells after removing. Structure searches share all but
// the reserved Pearl Rod slot; the rod may also borrow any free one. Values in, values out: no engine call, so
// tests/pearl-teleport.test.mjs bundles this file with esbuild.

/**
 * Command ticking areas the engine gives one world, across all dimensions (probe Q5, `bds:check`: 10, the 11th
 * refused). Inside a GameTest world it is 9: GameTest holds one itself.
 */
export const WORLD_AREA_CAP = 10;
export const GAMETEST_AREA_CAP = WORLD_AREA_CAP - 1;
/** Slots no structure search may take: a teleport is never starved by a search (L0-pear-ad01). */
export const PEARL_RESERVED_SLOTS = 1;

export type AreaClient = "structure" | "pearl";

export interface AreaHolding {
  structure: number;
  pearl: number;
}

/**
 * Whether `client` may add one more area. Structures stop short of the reserve, and of any slot the rod borrowed
 * beyond it; the rod stops only at the cap. Neither ever takes a slot the other holds.
 */
export function canAcquire(client: AreaClient, held: AreaHolding, capacity: number, reserved: number): boolean {
  if (held.structure + held.pearl >= capacity) return false;
  if (client === "pearl") return true;
  return held.structure < capacity - Math.max(reserved, held.pearl);
}

/** One slot taken from the budget. `release` is idempotent: a second call gives nothing back. */
export interface AreaLease {
  readonly client: AreaClient;
  release(): void;
}

export class AreaBudget {
  private readonly holding: AreaHolding = { structure: 0, pearl: 0 };
  /** Requests the budget turned down, by client: a refused add never reaches the engine. */
  readonly refused: AreaHolding = { structure: 0, pearl: 0 };

  constructor(
    readonly capacity: number = WORLD_AREA_CAP,
    readonly reserved: number = PEARL_RESERVED_SLOTS
  ) {}

  held(client?: AreaClient): number {
    return client === undefined ? this.holding.structure + this.holding.pearl : this.holding[client];
  }

  tryAcquire(client: AreaClient): AreaLease | undefined {
    if (!canAcquire(client, this.holding, this.capacity, this.reserved)) {
      this.refused[client]++;
      return undefined;
    }
    this.holding[client]++;
    let live = true;
    return {
      client,
      release: () => {
        if (!live) return;
        live = false;
        this.holding[client]--;
      },
    };
  }
}

/**
 * The release pack's one budget: `src/main.ts` hands it to the spawn search, `/andrew:find`, the ring loaders and the
 * Pearl Rod. The GameTest pack is another script context; it builds its own at GAMETEST_AREA_CAP.
 */
export const worldAreas = new AreaBudget();
