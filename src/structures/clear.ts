// Clearing a box with air, cut into pieces the engine accepts. Pure: the fill
// itself comes in as a callback, so node tests check the cutting directly.

import type { Vec3 } from "./registry";

/**
 * Probe Q10 (BDS 1.26.51.1): one fillBlocks call crosses chunk borders fine
 * (32×32×32 over 9 chunks in 16 ms) but refuses 40×30×40. This is its cap.
 */
export const FILL_CELL_LIMIT = 32768;

/** Inclusive min/max corners. */
export interface Box {
  min: Vec3;
  max: Vec3;
}

export const cells = (b: Box): number =>
  (b.max[0] - b.min[0] + 1) * (b.max[1] - b.min[1] + 1) * (b.max[2] - b.min[2] + 1);

/** The box of a structure: origin is the min corner, size the rotated size. */
export const boxOf = (origin: Vec3, size: Vec3): Box => ({
  min: [origin[0], origin[1], origin[2]],
  max: [origin[0] + size[0] - 1, origin[1] + size[1] - 1, origin[2] + size[2] - 1],
});

/**
 * Tiles that cover `box` exactly once, none outside it and none over `limit`
 * cells. Whole Y slabs while an XZ layer fits the limit, smaller tiles after.
 */
export function sliceBox(box: Box, limit = FILL_CELL_LIMIT): Box[] {
  if (!Number.isInteger(limit) || limit < 1) throw new Error(`clear: bad cell limit ${limit}`);
  const size = [0, 1, 2].map((k) => box.max[k] - box.min[k] + 1);
  if (size.some((n) => n <= 0)) return [];
  const dz = Math.min(size[2], limit);
  const dx = Math.min(size[0], Math.floor(limit / dz));
  const dy = Math.min(size[1], Math.floor(limit / (dx * dz)));
  const out: Box[] = [];
  for (let y = box.min[1]; y <= box.max[1]; y += dy) {
    for (let x = box.min[0]; x <= box.max[0]; x += dx) {
      for (let z = box.min[2]; z <= box.max[2]; z += dz) {
        out.push({
          min: [x, y, z],
          max: [Math.min(x + dx - 1, box.max[0]), Math.min(y + dy - 1, box.max[1]), Math.min(z + dz - 1, box.max[2])],
        });
      }
    }
  }
  return out;
}

/** Fill `box` with air through `fill`, one call per slice; returns the slices used. */
export function clearBox(box: Box, fill: (slice: Box) => void, limit = FILL_CELL_LIMIT): Box[] {
  const slices = sliceBox(box, limit);
  for (const s of slices) fill(s);
  return slices;
}
