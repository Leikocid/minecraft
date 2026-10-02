// Ring geometry for RMB's five TNT rings (L0-ring-p001, L0-ring-r001, L0-ring-ent1).
// The offset table is constant, computed once at module load; layout() only translates it.
// Pure geometry: no @minecraft/server import, the world is never read.

export interface RingColumn {
  x: number;
  z: number;
  /** Explosion power of the charge in this column. */
  power: number;
}

export interface Ring {
  /** Diameter, blocks. */
  d: number;
  /** Radius, d / 2. */
  r: number;
  /** Explosion power of every cell of this ring. */
  power: number;
  cells: RingColumn[];
}

/**
 * Guards orbc's flight-sweep budget and ring's blast budget (L0-ring-as06).
 * The bound is the tick budget, not the shipped table: at ring's 48 blasts a
 * tick this many charges drain in 6 ticks.
 */
export const RING_MAX_CHARGES = 256;

/**
 * Blocks: the rings refuse a target nearer than this (§6, amended by
 * decision-ring-power-per-ring-4-4-2-1-1). It belongs to the layout because the
 * layout is the reason — the outer ring stands 14 blocks out and the d=7 ring's
 * cells are power 4, so a shooter nearer than this is aiming at himself.
 * Measured with the shipped powers (probe_ring_damage_by_distance): standing
 * still 8 blocks from the target costs 20 in six hits and 10 costs 11, while
 * nothing at all reaches 18 — so the minimum buys a shot one can walk away
 * from, not one that can be watched from the spot.
 */
export const RING_MIN_RANGE = 7;

// Math.round(-0) and -x at x = 0 both produce -0; normalize so offsets compare
// equal to +0 (assert.deepStrictEqual distinguishes -0 from 0).
const zero = (n: number): number => (n === 0 ? 0 : n);

/** Midpoint circle with a real radius `r`: 8-connected and closed (L0-ring-p001 step 2). */
function ringCells(r: number, power: number): RingColumn[] {
  const seen = new Map<string, RingColumn>();
  const add = (x: number, z: number): void => {
    const cx = zero(x);
    const cz = zero(z);
    seen.set(`${cx},${cz}`, { x: cx, z: cz, power });
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
export function buildColumns(diameters: number[], powers: number[] = []): { rings: Ring[]; columns: RingColumn[] } {
  const powerOf = (i: number): number => powers[i] ?? BLAST_POWER_DEFAULT;
  const rings = diameters
    .map((d, i) => ({ d, power: powerOf(i) }))
    .filter(({ d }) => d > 1)
    .map(({ d, power }) => ({ d, r: d / 2, power, cells: ringCells(d / 2, power) }));

  const seen = new Map<string, RingColumn>();
  const centre = diameters.indexOf(1);
  if (centre >= 0) seen.set('0,0', { x: 0, z: 0, power: powerOf(centre) });
  for (const ring of rings) for (const cell of ring.cells) seen.set(`${cell.x},${cell.z}`, cell);
  const columns = [...seen.values()];

  if (columns.length > RING_MAX_CHARGES) {
    throw new Error(`ring layout: ${columns.length} columns exceeds RING_MAX_CHARGES (${RING_MAX_CHARGES})`);
  }
  return { rings, columns };
}

/** d = 1/7/14/21/28 → r = d/2 (Orbital §10). */
const DIAMETERS = [1, 7, 14, 21, 28];

/**
 * Explosion power per ring from the centre outwards (§10, amended by
 * decision-ring-power-per-ring-4-4-2-1-1).
 *
 * Power is a radius, not an energy budget: a blast reaches 2 x power, and equal
 * blasts in one tick do not stack — four power-4 blasts 7 blocks away hurt an
 * entity once, for 6.1 (probe_blast_stacking). So what a player takes is the
 * strongest single cell within reach of where he stands, never the sum of 201,
 * and the per-ring power is what decides both his damage and the hole each cell
 * leaves: on ordinary soil power 4 breaks 133 cells, 2 breaks 38, 1 breaks 9,
 * and 0.5 breaks none (probe_crater_by_power).
 */
const POWERS = [4, 4, 2, 1, 1];

/** The power a column with no ring of its own gets, and the largest the layout may hold. */
const BLAST_POWER_DEFAULT = 4;

const { rings: RINGS, columns: COLUMNS } = buildColumns(DIAMETERS, POWERS);

const POWER_BY_OFFSET: ReadonlyMap<string, number> = new Map(COLUMNS.map((c) => [`${c.x},${c.z}`, c.power]));

/**
 * The power of the column `dx,dz` away from the target, or undefined for an
 * offset the layout does not hold. ring reads it at contact: the charge itself
 * carries no power, and the offset identifies its column exactly.
 */
export function powerAtOffset(dx: number, dz: number): number | undefined {
  return POWER_BY_OFFSET.get(`${dx},${dz}`);
}

export const RING_LAYOUT = {
  centre: { x: 0, z: 0, power: POWERS[0] } as RingColumn,
  rings: RINGS,
  columns: COLUMNS,
  count: COLUMNS.length,
};

/** Translates the constant offset table onto `target`'s column (L0-ring-p001 step 5). */
export function layout(target: { x: number; z: number }): RingColumn[] {
  return COLUMNS.map((o) => ({ x: target.x + o.x, z: target.z + o.z, power: o.power }));
}
