// The LMB penetrator's column plan (L0-pntr-ent1, L0-pntr-r001, L0-pntr-p001)
// and per-cell classifier (L0-pntr-ent3). Both are pure: no world reads, so
// planning can never hit an unloaded chunk, and the same attackId/point/
// heightRange always give the same cell set (a gametest relies on this).
// Type-only engine import, so this file bundles without @minecraft/server.

import type { Vector3 } from "@minecraft/server";
import { PENETRATOR_KEEP } from "./penetrator-keep";

export interface HeightRange {
  min: number;
}

/** Layers sharing one mask, so the shaft walls look blast-ragged, not square (L0-pntr-ad02). */
export const BAND_HEIGHT = 4;

/** Mask half-width: offsets run from -MASK_RADIUS to +MASK_RADIUS on each axis (a 7×7 grid). */
export const MASK_RADIUS = 3;
const MASK_WIDTH = MASK_RADIUS * 2 + 1;
const MASK_CELLS = MASK_WIDTH * MASK_WIDTH;

export interface ColumnPlan {
  readonly attackId: string;
  readonly cx: number;
  readonly cz: number;
  /** The detonation cell's y, inclusive. Nothing above it is planned. */
  readonly top: number;
  /** heightRange.min, inclusive — or `top` itself when the trigger is at or below it. */
  readonly bottom: number;
  readonly bandHeight: number;
  /** One 49-bit mask per band, row-major at (dz+MASK_RADIUS)*MASK_WIDTH+(dx+MASK_RADIUS). */
  readonly masks: readonly Uint8Array[];
}

/** mulberry32: a small, fast PRNG that is reproducible from one 32-bit seed. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a, 32-bit: turns an attackId string into a well-mixed PRNG seed. */
function hashSeed(attackId: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < attackId.length; i++) {
    hash ^= attackId.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * One band mask (L0-pntr-ad02): the 3×3 core is always set; the 12 non-corner
 * cells of the 5×5 ring at p=0.9; its 4 corners at p=0.5; the 24 cells of the
 * 7×7 rim at p=0.08. Draws are made only for probabilistic cells, in row-major
 * order, so the same PRNG stream always gives the same mask.
 */
function drawMask(next: () => number): Uint8Array {
  const mask = new Uint8Array(MASK_CELLS);
  for (let dz = -MASK_RADIUS; dz <= MASK_RADIUS; dz++) {
    for (let dx = -MASK_RADIUS; dx <= MASK_RADIUS; dx++) {
      const ring = Math.max(Math.abs(dx), Math.abs(dz));
      let hit: boolean;
      if (ring <= 1) {
        hit = true;
      } else if (ring === 2) {
        const isCorner = Math.abs(dx) === 2 && Math.abs(dz) === 2;
        hit = next() < (isCorner ? 0.5 : 0.9);
      } else {
        hit = next() < 0.08;
      }
      if (hit) mask[(dz + MASK_RADIUS) * MASK_WIDTH + (dx + MASK_RADIUS)] = 1;
    }
  }
  return mask;
}

/**
 * L0-pntr-p001: the detonation cell down to heightRange.min, inclusive of
 * both ends. A trigger at or below the floor gives a one-layer column.
 */
export function planColumn(attackId: string, point: Vector3, heightRange: HeightRange): ColumnPlan {
  const top = Math.floor(point.y);
  const bottom = top <= heightRange.min ? top : heightRange.min;
  const bandCount = Math.ceil((top - bottom + 1) / BAND_HEIGHT);
  const next = mulberry32(hashSeed(attackId));
  const masks: Uint8Array[] = [];
  for (let band = 0; band < bandCount; band++) masks.push(drawMask(next));
  return { attackId, cx: Math.floor(point.x), cz: Math.floor(point.z), top, bottom, bandHeight: BAND_HEIGHT, masks };
}

function bandIndex(plan: ColumnPlan, y: number): number {
  return Math.floor((plan.top - y) / plan.bandHeight);
}

/** (dx,dz) offsets from the plan centre removed at layer `y`, before classification. Empty outside [bottom, top]. */
export function layerOffsets(plan: ColumnPlan, y: number): Array<{ dx: number; dz: number }> {
  if (y > plan.top || y < plan.bottom) return [];
  const mask = plan.masks[bandIndex(plan, y)];
  const offsets: Array<{ dx: number; dz: number }> = [];
  for (let dz = -MASK_RADIUS; dz <= MASK_RADIUS; dz++) {
    for (let dx = -MASK_RADIUS; dx <= MASK_RADIUS; dx++) {
      if (mask[(dz + MASK_RADIUS) * MASK_WIDTH + (dx + MASK_RADIUS)] === 1) offsets.push({ dx, dz });
    }
  }
  return offsets;
}

/** Whether (x,y,z) is in the plan's footprint, before classification. */
export function isPlannedCell(plan: ColumnPlan, x: number, y: number, z: number): boolean {
  if (y > plan.top || y < plan.bottom) return false;
  const dx = x - plan.cx;
  const dz = z - plan.cz;
  if (dx < -MASK_RADIUS || dx > MASK_RADIUS || dz < -MASK_RADIUS || dz > MASK_RADIUS) return false;
  const mask = plan.masks[bandIndex(plan, y)];
  return mask[(dz + MASK_RADIUS) * MASK_WIDTH + (dx + MASK_RADIUS)] === 1;
}

export type CellClass = "skip" | "keep" | "removeContainer" | "removeWaterlogged" | "remove";

/** The minimal block surface classify() needs (L0-pntr-ent3), so a unit test needs no engine. */
export interface CellProbe {
  readonly typeId: string;
  readonly isAir: boolean;
  readonly isLiquid: boolean;
  readonly isWaterlogged: boolean;
  readonly hasInventory: boolean;
}

/** L0-pntr-ent3. Order matters: a waterlogged container classifies as a container, not as water. */
export function classify(block: CellProbe): CellClass {
  if (block.isAir) return "skip";
  if (block.isLiquid || PENETRATOR_KEEP.has(block.typeId)) return "keep";
  if (block.hasInventory) return "removeContainer";
  if (block.isWaterlogged) return "removeWaterlogged";
  return "remove";
}
