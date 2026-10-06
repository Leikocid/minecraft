// The block-hit crater and the sculk around it as plain cells (spec §6, §7; L0-adr-sctr §1, L0-sclk-r003,
// r004, ent4). Pure: the planner reads the world only through a CellProbe, so the same (impact, face, seed)
// over the same cells always gives the same plan. Type-only engine import, so this file bundles without
// @minecraft/server.

import type { Vector3 } from "@minecraft/server";

/** The hit face, as `Direction` spells it. */
export type Face = "Up" | "Down" | "North" | "South" | "East" | "West";

/**
 * What the planner needs to know about a cell.
 * - `solid`: a solid full block sculk may replace;
 * - `passable`: not air, but liquids flow through it (grass, a flower, a torch): it exposes the cell behind;
 * - `other`: anything else the crater may carve but sculk never replaces (a slab, a container, a block entity);
 * - `keep`: on the shared deny list (src/terrain/keep.ts);
 * - `unloaded`: never read, never written (C-12).
 */
export type CellKind = "air" | "passable" | "liquid" | "keep" | "solid" | "other" | "unloaded";

export type CellProbe = (at: Vector3) => CellKind;

/** Footprint half-width: 5×5 in the plane of the hit face. */
export const CRATER_HALF = 2;
/** Layers into the face, the impact cell's own layer first. */
export const CRATER_DEPTH = 3;
/** Ellipsoid semi-axis in the face plane (r003: ≈ 2.5). */
const CRATER_RADIUS = 2.5;
/** Each column's radius is scaled by 1 ± this, by seed. */
const RADIUS_JITTER = 0.2;
/** Each column's depth moves by up to ± this before rounding, by seed. */
const DEPTH_JITTER = 0.5;
/** Layers outside the face the sculk search starts from, so a rim a little above the impact still gets sculk. */
export const SCULK_REACH_OUT = 2;
/** Share of the outer ring (corners aside) left bare by seed: the ragged edge of r004. */
const RAGGED_SHARE = 0.3;

export interface Column {
  u: number;
  v: number;
  depth: number;
}

export interface CarvePlan {
  impact: Vector3;
  face: Face;
  seed: number;
  /** Cells turned to air, in column order; every one inside the 5×5×3 box. */
  air: Vector3[];
  /** Cells turned to sculk, at most one per footprint column. */
  sculk: Vector3[];
  /** The union box of `air` and `sculk`, inclusive; undefined when both are empty. */
  box: { min: Vector3; max: Vector3 } | undefined;
}

/** mulberry32: a 32-bit seed gives the same stream on every engine. */
function stream(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ADD: Record<Face, Vector3> = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 },
};

/** The outward normal of `face`, and two unit axes spanning its plane. */
export function faceAxes(face: Face): { out: Vector3; u: Vector3; v: Vector3 } {
  const out = ADD[face];
  if (out.y !== 0) return { out, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 0, z: 1 } };
  if (out.z !== 0) return { out, u: { x: 1, y: 0, z: 0 }, v: { x: 0, y: 1, z: 0 } };
  return { out, u: { x: 0, y: 0, z: 1 }, v: { x: 0, y: 1, z: 0 } };
}

/** The cell `u`, `v` across the face plane and `k` layers into the block from `impact` (k < 0 is outside it). */
export function cellAt(impact: Vector3, face: Face, u: number, v: number, k: number): Vector3 {
  const a = faceAxes(face);
  return {
    x: impact.x + a.u.x * u + a.v.x * v - a.out.x * k,
    y: impact.y + a.u.y * u + a.v.y * v - a.out.y * k,
    z: impact.z + a.u.z * u + a.v.z * v - a.out.z * k,
  };
}

export const cellKey = (c: Vector3): string => `${c.x},${c.y},${c.z}`;

/**
 * Depth of each of the 25 footprint columns: an ellipsoid with semi-axes ≈ (2.5, 2.5, 3) whose radius and depth
 * are jittered per column by `seed`. The inner 3×3 is always ≥ 2 deep, so the impact cell and the one behind it
 * always go; at least one column stays at 0, so the footprint is never a full 5×5.
 */
export function craterColumns(seed: number): Column[] {
  const next = stream(seed);
  const columns: Column[] = [];
  for (let u = -CRATER_HALF; u <= CRATER_HALF; u++) {
    for (let v = -CRATER_HALF; v <= CRATER_HALF; v++) {
      const radius = CRATER_RADIUS * (1 + RADIUS_JITTER * (2 * next() - 1));
      const t = Math.hypot(u, v) / radius;
      const jitter = DEPTH_JITTER * (2 * next() - 1);
      let depth = t >= 1 ? 0 : Math.round(CRATER_DEPTH * Math.sqrt(1 - t * t) + jitter);
      depth = Math.min(CRATER_DEPTH, Math.max(0, depth));
      if (Math.abs(u) <= 1 && Math.abs(v) <= 1) depth = Math.max(depth, 2);
      columns.push({ u, v, depth });
    }
  }
  if (columns.every((c) => c.depth > 0)) {
    const corners = columns.filter((c) => Math.abs(c.u) === CRATER_HALF && Math.abs(c.v) === CRATER_HALF);
    corners[seed % corners.length].depth = 0;
  }
  return columns;
}

/**
 * The footprint columns that may get sculk: never a corner, and about RAGGED_SHARE of the rest of the outer ring
 * is left bare by `seed` (r004). The inner 3×3 always takes part.
 */
export function sculkColumns(seed: number): Array<{ u: number; v: number }> {
  const next = stream((seed ^ 0x9e3779b9) >>> 0);
  const out: Array<{ u: number; v: number }> = [];
  for (let u = -CRATER_HALF; u <= CRATER_HALF; u++) {
    for (let v = -CRATER_HALF; v <= CRATER_HALF; v++) {
      const rim = Math.abs(u) === CRATER_HALF || Math.abs(v) === CRATER_HALF;
      const corner = Math.abs(u) === CRATER_HALF && Math.abs(v) === CRATER_HALF;
      const roll = next();
      if (corner || (rim && roll < RAGGED_SHARE)) continue;
      out.push({ u, v });
    }
  }
  return out;
}

const CARVED: ReadonlySet<CellKind> = new Set(["solid", "other", "passable"]);

/**
 * Cells the crater turns to air. Nothing at all when the impact block itself is kept, liquid, air or unloaded
 * (L0-sclk-p005 step 1); otherwise every shaped cell except air, liquids, the deny list and unloaded cells.
 */
export function craterCells(impact: Vector3, face: Face, seed: number, probe: CellProbe): Vector3[] {
  if (!CARVED.has(probe(impact))) return [];
  const cells: Vector3[] = [];
  for (const c of craterColumns(seed)) {
    for (let k = 0; k < c.depth; k++) {
      const at = cellAt(impact, face, c.u, c.v, k);
      if (CARVED.has(probe(at))) cells.push(at);
    }
  }
  return cells;
}

/**
 * Cells that turn to sculk once the crater is carved: in each sculk column, the first cell met coming in from
 * outside the face that is not air or passable — if it is `solid` and the cell before it is air or passable.
 * A liquid, the deny list, an `other` block or an unloaded cell there leaves the column bare. Cells in `carved`
 * count as air.
 */
export function sculkCells(impact: Vector3, face: Face, seed: number, carved: ReadonlySet<string>, probe: CellProbe): Vector3[] {
  const kind = (at: Vector3): CellKind => (carved.has(cellKey(at)) ? "air" : probe(at));
  const cells: Vector3[] = [];
  for (const { u, v } of sculkColumns(seed)) {
    let exposed = false;
    for (let k = -SCULK_REACH_OUT - 1; k <= CRATER_DEPTH; k++) {
      const at = cellAt(impact, face, u, v, k);
      const here = kind(at);
      if (here === "air" || here === "passable") {
        exposed = true;
        continue;
      }
      if (here === "solid" && exposed && k >= -SCULK_REACH_OUT) cells.push(at);
      break;
    }
  }
  return cells;
}

function boxOf(cells: readonly Vector3[]): CarvePlan["box"] {
  if (cells.length === 0) return undefined;
  const min = { ...cells[0] };
  const max = { ...cells[0] };
  for (const c of cells) {
    min.x = Math.min(min.x, c.x);
    min.y = Math.min(min.y, c.y);
    min.z = Math.min(min.z, c.z);
    max.x = Math.max(max.x, c.x);
    max.y = Math.max(max.y, c.y);
    max.z = Math.max(max.z, c.z);
  }
  return { min, max };
}

/** The whole block-hit plan: crater cells first, then the sculk around and inside it (L0-sclk-ent4). */
export function planCrater(impact: Vector3, face: Face, seed: number, probe: CellProbe): CarvePlan {
  const air = craterCells(impact, face, seed, probe);
  const sculk = sculkCells(impact, face, seed, new Set(air.map(cellKey)), probe);
  return { impact: { ...impact }, face, seed, air, sculk, box: boxOf([...air, ...sculk]) };
}
