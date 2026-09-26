// Timing-only template for strf-p006 question 7: an all-air 35×30×35 volume,
// the size class of the largest release structure. Built in memory by the
// GameTest pack instead of shipping a ~37k-cell .mcstructure in the behavior
// pack, so it never reaches a release.

import { BlockPermutation, Structure, StructureSaveMode, Vector3, world } from "@minecraft/server";

export const PROBE_BIG_ID = "andrew:probe_big";

/** x/z footprint 35×35, height 30. */
export const PROBE_BIG_SIZE: Vector3 = { x: 35, y: 30, z: 35 };

/**
 * Create (or recreate) the template with explicit air in every cell.
 *
 * createEmpty leaves every cell empty (getBlockPermutation reads undefined on
 * BDS 1.26.51.1); explicit air makes place() write every cell, the same way a
 * release template with a hollow interior does.
 */
export function buildProbeBig(): Structure {
  if (world.structureManager.get(PROBE_BIG_ID) !== undefined) world.structureManager.delete(PROBE_BIG_ID);
  const structure = world.structureManager.createEmpty(PROBE_BIG_ID, PROBE_BIG_SIZE, StructureSaveMode.Memory);
  const air = BlockPermutation.resolve("minecraft:air");
  for (let x = 0; x < PROBE_BIG_SIZE.x; x++)
    for (let y = 0; y < PROBE_BIG_SIZE.y; y++)
      for (let z = 0; z < PROBE_BIG_SIZE.z; z++) structure.setBlockPermutation({ x, y, z }, air);
  return structure;
}
