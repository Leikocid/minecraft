// The sculk patch under an entity a bolt hit (spec §5, §7; L0-sclk-p004 step 5, r004, xasm24). Pure, like
// crater-plan.ts: the planner reads the world only through a CellProbe, so the same (feet, seed) over the same
// cells always gives the same plan. Type-only engine import.

import type { Vector3 } from "@minecraft/server";
import { type CarvePlan, type CellKind, type CellProbe, boxOf, sculkColumns } from "./crater-plan";

/** xasm24: the surface is searched at most this many cells below the feet cell; none there, no sculk. */
export const PATCH_REACH_DOWN = 6;
/** A surface this many cells above the feet cell still counts: a step beside the target gets sculk too. */
export const PATCH_REACH_UP = 1;

export function feetCell(location: Vector3): Vector3 {
  return { x: Math.floor(location.x), y: Math.floor(location.y), z: Math.floor(location.z) };
}

const open = (kind: CellKind): boolean => kind === "air" || kind === "passable";

/**
 * The cells that turn to sculk under `feet`: in each sculk column of `seed` (5×5, corners never, a ragged outer
 * ring), the first cell met coming down from PATCH_REACH_UP above the feet cell that is not air or passable — if
 * it is `solid` and the cell above it is air or passable. A liquid, the deny list, an `other` block, an unloaded
 * cell or no surface within PATCH_REACH_DOWN leaves the column bare. Nothing is ever carved: `air` is empty.
 */
export function planPatch(feet: Vector3, seed: number, probe: CellProbe): CarvePlan {
  const cells: Vector3[] = [];
  for (const { u, v } of sculkColumns(seed)) {
    const at = (dy: number): Vector3 => ({ x: feet.x + u, y: feet.y + dy, z: feet.z + v });
    let exposed = open(probe(at(PATCH_REACH_UP + 1)));
    for (let dy = PATCH_REACH_UP; dy >= -PATCH_REACH_DOWN; dy--) {
      const here = probe(at(dy));
      if (open(here)) {
        exposed = true;
        continue;
      }
      if (here === "solid" && exposed) cells.push(at(dy));
      break;
    }
  }
  return { impact: { ...feet }, face: "Up", seed, air: [], sculk: cells, box: boxOf(cells) };
}
