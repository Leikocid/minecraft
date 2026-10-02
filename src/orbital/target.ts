// The target of an activation (L0-orbc-ad01, L0-orbc-r003): the event's block
// when the event names one within range, else the view ray. Both go through
// lockTarget() and the one eligibility filter. Type-only engine imports.

import type { Block, Direction, Player, Vector3 } from "@minecraft/server";
import { isContact } from "./charge";

/**
 * Blocks, eye to the nearest point of the target block (§6, amended by
 * decision-aim-range-25-and-spawn-height-60: at 10 the shooter stood inside his
 * own ring field, whose outer ring reaches 14).
 */
export const TARGET_RANGE = 25;

export interface TargetLock {
  block: Block;
  /** The block's own location, integer: never the air cell in front of the hit face. */
  location: Vector3;
  dimensionId: string;
  /** Diagnostics only (L0-orbc-ent2): the column is the block's, whatever the face. */
  face: Direction | undefined;
}

/**
 * Distance from `eye` to the nearest point of the unit block at `cell`.
 * Geometry, not `BlockRaycastHit.faceLocation`: that is the hit point's
 * fractional part, and a hit on a block's +1 plane (South, East, Up) wraps to 0.
 */
export function distanceToBlock(eye: Vector3, cell: Vector3): number {
  const axis = (e: number, lo: number): number => (e < lo ? lo - e : e > lo + 1 ? e - (lo + 1) : 0);
  return Math.hypot(axis(eye.x, cell.x), axis(eye.y, cell.y), axis(eye.z, cell.z));
}

/** A block that can be the target: within range, no nearer than `minRange`, and a contact block by the charge's own rule. */
function eligible(eye: Vector3, block: Block, minRange: number): boolean {
  const d = distanceToBlock(eye, block.location);
  return d <= TARGET_RANGE && d >= minRange && isContact(block);
}

function lockOf(block: Block, face: Direction | undefined): TargetLock {
  const { x, y, z } = block.location;
  return { block, location: { x, y, z }, dimensionId: block.dimension.id, face };
}

/**
 * The block `player` fires at, or undefined when there is none. Reads the
 * player once; the lock is a copy and never follows the player afterwards.
 */
export function lockTarget(player: Player, eventBlock?: Block, eventFace?: Direction, minRange = 0): TargetLock | undefined {
  const eye = player.getHeadLocation();
  if (eventBlock?.isValid === true && eventBlock.dimension.id === player.dimension.id && eligible(eye, eventBlock, minRange)) {
    return lockOf(eventBlock, eventFace);
  }
  const hit = player.getBlockFromViewDirection({
    maxDistance: TARGET_RANGE,
    includeLiquidBlocks: false,
    includePassableBlocks: false,
  });
  // A nearer block the ray met is not swapped for a farther one: the shot is
  // refused, as it is for a block out of range (L0-orbc-r004).
  return hit !== undefined && eligible(eye, hit.block, minRange) ? lockOf(hit.block, hit.face) : undefined;
}
