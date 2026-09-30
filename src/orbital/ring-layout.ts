// Ring geometry for RMB's five TNT rings (L0-ring-p001, L0-ring-r001, L0-ring-ent1).
// The offset table is constant, computed once at module load; layout() only translates it.
// Pure geometry: no @minecraft/server import, the world is never read.

export interface RingColumn {
  x: number;
  z: number;
}

export interface Ring {
  /** Diameter, blocks. */
  d: number;
  /** Radius, d / 2. */
  r: number;
  cells: RingColumn[];
}

/**
 * Guards orbc's flight-sweep budget and ring's blast budget (L0-ring-as06).
 * The bound is the tick budget, not the shipped table: at ring's 48 blasts a
 * tick this many charges drain in 6 ticks.
 */
export const RING_MAX_CHARGES = 256;

// Math.round(-0) and -x at x = 0 both produce -0; normalize so offsets compare
// equal to +0 (assert.deepStrictEqual distinguishes -0 from 0).
const zero = (n: number): number => (n === 0 ? 0 : n);

/** Midpoint circle with a real radius `r`: 8-connected and closed (L0-ring-p001 step 2). */
function ringCells(r: number): RingColumn[] {
  const seen = new Map<string, RingColumn>();
  const add = (x: number, z: number): void => {
    const cx = zero(x);
    const cz = zero(z);
    seen.set(`${cx},${cz}`, { x: cx, z: cz });
  };

  let x = 0;
  let z = Math.round(r);
  while (x <= z) {
    add(x, z);
    add(-x, z);
    add(x, -z);
    add(-x, -z);
    add(z, x);
    add(-z, x);
    add(z, -x);
    add(-z, -x);
    x += 1;
    if (x * x + (z - 0.5) * (z - 0.5) > r * r) z -= 1;
  }

  return [...seen.values()].sort((a, b) => Math.atan2(a.z, a.x) - Math.atan2(b.z, b.x));
}

/**
 * Centre (d = 1) plus one ring per d > 1, unioned and de-duplicated into
 * columns, ascending d then angle order (L0-ring-ent1, L0-ring-p001 step 4).
 * Exposed so the RING_MAX_CHARGES guard is testable without touching the
 * shipped diameter table.
 */
export function buildColumns(diameters: number[]): { rings: Ring[]; columns: RingColumn[] } {
  const rings = diameters
    .filter((d) => d > 1)
    .map((d) => ({ d, r: d / 2, cells: ringCells(d / 2) }));

  const seen = new Map<string, RingColumn>();
  if (diameters.includes(1)) seen.set('0,0', { x: 0, z: 0 });
  for (const ring of rings) for (const cell of ring.cells) seen.set(`${cell.x},${cell.z}`, cell);
  const columns = [...seen.values()];

  if (columns.length > RING_MAX_CHARGES) {
    throw new Error(`ring layout: ${columns.length} columns exceeds RING_MAX_CHARGES (${RING_MAX_CHARGES})`);
  }
  return { rings, columns };
}

/** d = 1/7/14/21/28 → r = d/2 (Orbital §10). */
const DIAMETERS = [1, 7, 14, 21, 28];
const { rings: RINGS, columns: COLUMNS } = buildColumns(DIAMETERS);

export const RING_LAYOUT = {
  centre: { x: 0, z: 0 } as RingColumn,
  rings: RINGS,
  columns: COLUMNS,
  count: COLUMNS.length,
};

/** Translates the constant offset table onto `target`'s column (L0-ring-p001 step 5). */
export function layout(target: RingColumn): RingColumn[] {
  return COLUMNS.map((o) => ({ x: target.x + o.x, z: target.z + o.z }));
}
