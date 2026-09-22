// Pure geometry and block classification for the Web Sword trap (spec §5, §6).
//
// No engine calls and no engine *values*: every import below is `import type`,
// which TypeScript erases, so this file carries no runtime import of
// @minecraft/server at all — the same trick rules.ts uses so a node test can
// bundle it with esbuild. The one enum this module has to compare against
// (Direction) is handled by its string values rather than by importing the enum
// object; see FACE_OFFSETS.
//
// It reads Block objects (typeId, isAir, isLiquid, getComponent) but never
// writes: trap.ts owns every setType call. That split is what makes the
// "should this cell become cobweb?" decision testable off the engine.

import type { Block, Direction, Vector3 } from "@minecraft/server";

/** The block the ability places. Vanilla cobweb — nothing custom (spec §5). */
export const WEB_BLOCK_ID = "minecraft:web";

/**
 * Blocks the ability must never replace: unbreakable, world-structural or
 * technical blocks whose loss would be unrecoverable or would break a map.
 * [src: webswordspecv1ruen §6; decision-q-013-protected-blocks]
 *
 * Deliberately wider than the spec's own examples — the governing posture is
 * "сомневаешься — пропусти", so a block is added here on suspicion, and the
 * cost of a false entry is one skipped cobweb.
 */
export const PROTECTED_BLOCK_IDS: ReadonlySet<string> = new Set([
  "minecraft:bedrock",
  "minecraft:barrier",
  "minecraft:command_block",
  "minecraft:chain_command_block",
  "minecraft:repeating_command_block",
  "minecraft:structure_block",
  "minecraft:structure_void",
  "minecraft:jigsaw",
  "minecraft:end_portal",
  "minecraft:end_portal_frame",
  "minecraft:end_gateway",
  "minecraft:portal",
  "minecraft:light_block",
  "minecraft:light_block_0",
  "minecraft:light_block_15",
  "minecraft:reinforced_deepslate",
  "minecraft:moving_block",
  "minecraft:movingblock",
  "minecraft:pistonarmcollision",
  "minecraft:sticky_piston_arm_collision",
  "minecraft:allow",
  "minecraft:deny",
  "minecraft:border_block",
  "minecraft:client_request_placeholder_block",
  "minecraft:unknown",
]);

/**
 * Blocks that carry data or contents a player would lose: containers and
 * functional block entities. [src: webswordspecv1ruen §6 — 'не заменять
 * контейнеры и функциональные блоки с важным содержимым/данными']
 *
 * The `minecraft:inventory` component check in classify() already catches most
 * containers on a live engine, but not all of these have one (a sign, a bed, a
 * spawner, a jukebox with no disc), so the list stands on its own.
 */
export const BLOCK_ENTITY_IDS: ReadonlySet<string> = new Set([
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:ender_chest",
  "minecraft:barrel",
  "minecraft:shulker_box",
  "minecraft:undyed_shulker_box",
  "minecraft:hopper",
  "minecraft:dropper",
  "minecraft:dispenser",
  "minecraft:furnace",
  "minecraft:lit_furnace",
  "minecraft:blast_furnace",
  "minecraft:lit_blast_furnace",
  "minecraft:smoker",
  "minecraft:lit_smoker",
  "minecraft:brewing_stand",
  "minecraft:beacon",
  "minecraft:lectern",
  "minecraft:jukebox",
  "minecraft:mob_spawner",
  "minecraft:trial_spawner",
  "minecraft:vault",
  "minecraft:campfire",
  "minecraft:soul_campfire",
  "minecraft:enchanting_table",
  "minecraft:anvil",
  "minecraft:chipped_anvil",
  "minecraft:damaged_anvil",
  "minecraft:crafter",
  "minecraft:crafting_table",
  "minecraft:decorated_pot",
  "minecraft:bell",
  "minecraft:conduit",
  "minecraft:bed",
  "minecraft:beehive",
  "minecraft:bee_nest",
  "minecraft:chiseled_bookshelf",
  "minecraft:cartography_table",
  "minecraft:smithing_table",
  "minecraft:loom",
  "minecraft:stonecutter_block",
  "minecraft:grindstone",
  "minecraft:flower_pot",
  "minecraft:sculk_shrieker",
  "minecraft:sculk_sensor",
  "minecraft:calibrated_sculk_sensor",
  "minecraft:lodestone",
  "minecraft:respawn_anchor",
  "minecraft:end_crystal",
]);

/**
 * Suffixes that identify whole colour/wood families of data-carrying blocks.
 *
 * Bedrock flattened these into one id per variant (`minecraft:white_bed`,
 * `minecraft:oak_hanging_sign`, `minecraft:magenta_shulker_box`), so matching
 * by suffix is what keeps the list from being an exhaustive colour table that
 * goes stale the next time a wood type is added.
 */
export const PROTECTED_ID_SUFFIXES: ReadonlyArray<string> = [
  "_shulker_box",
  "_bed",
  "_banner",
  "_sign",
  "_head",
  "_skull",
  "_command_block",
  "_anvil",
  "_campfire",
  "_spawner",
  "_beehive",
  "_bookshelf",
  "_chest",
];

/** Whether the ability must leave a block of this type alone. */
export function isProtectedBlockId(typeId: string): boolean {
  if (PROTECTED_BLOCK_IDS.has(typeId) || BLOCK_ENTITY_IDS.has(typeId)) {
    return true;
  }
  return PROTECTED_ID_SUFFIXES.some((suffix) => typeId.endsWith(suffix));
}

/**
 * Unit offset from a block towards the face that was hit.
 *
 * North/south follow the engine's own `Block.north()` / `Block.south()`
 * documentation — north is −Z, south is +Z. The `Direction` enum's own doc
 * comments in @minecraft/server 2.10.0 claim the opposite (north = z + 1) and
 * are simply wrong; going by them would push the cube to the far side of the
 * target on two of the six faces.
 *
 * Keyed by the enum's string values so that `Direction` stays a type-only
 * import (the enum members are `'Up'`, `'Down'`, … verbatim).
 */
const FACE_OFFSETS: Readonly<Record<string, Vector3>> = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 },
};

export function faceOffset(face: Direction): Vector3 {
  // The fallback is unreachable for a Direction the engine produced, and is a
  // zero vector rather than a throw: an unknown face means the cube centres on
  // the hit block itself, which replaces one extra block instead of losing the
  // whole activation.
  return FACE_OFFSETS[face as string] ?? { x: 0, y: 0, z: 0 };
}

/** The cell adjacent to `block`, on the side the ray came in through (Q-011). */
export function adjacentCell(blockLocation: Vector3, face: Direction): Vector3 {
  const offset = faceOffset(face);
  return {
    x: blockLocation.x + offset.x,
    y: blockLocation.y + offset.y,
    z: blockLocation.z + offset.z,
  };
}

/** Floors a continuous position to the block cell that contains it. */
export function toCell(location: Vector3): Vector3 {
  return {
    x: Math.floor(location.x),
    y: Math.floor(location.y),
    z: Math.floor(location.z),
  };
}

/**
 * The 27 cells of the 3×3×3 cube centred on `center` — the centre included
 * (Q-011). Order is deterministic (x, then y, then z ascending) so a failing
 * run is reproducible.
 */
export function planCells(center: Vector3): Vector3[] {
  const cells: Vector3[] = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        cells.push({ x: center.x + dx, y: center.y + dy, z: center.z + dz });
      }
    }
  }
  return cells;
}

export type CellPlan = "place" | "skip";

/**
 * Whether one cell of the cube should become cobweb.
 *
 * `undefined` means the cell is outside the loaded world — the caller got
 * nothing back from `getBlock` — and is skipped rather than forced, so the
 * ability never writes into an unloaded chunk (spec §6, §12).
 *
 * Everything that is not positively recognised as replaceable is skipped:
 * air, liquid and an ordinary block with no protection and no block entity are
 * the only three `place` cases. [src: decision-q-013-protected-blocks —
 * 'сомневаешься — пропусти']
 */
export function classify(block: Block | undefined): CellPlan {
  if (block === undefined) {
    return "skip";
  }

  try {
    // Already cobweb: nothing to do, and the caller must not count it as
    // placed — a cube inside an existing web would otherwise spend the
    // cooldown having changed nothing.
    if (block.typeId === WEB_BLOCK_ID) {
      return "skip";
    }
    if (isProtectedBlockId(block.typeId)) {
      return "skip";
    }
    // The live check that covers containers this file's list has not heard of,
    // including ones added by other add-ons.
    if (block.getComponent("minecraft:inventory") !== undefined) {
      return "skip";
    }
    // Air, liquid and an ordinary solid block all end up here — the three
    // replaceable cases (spec §6). The reads above (`typeId`, `getComponent`)
    // are what throw for a cell outside the loaded world, so a bad coordinate
    // becomes a skip in the catch below rather than a failed setType.
    return "place";
  } catch {
    // Any of the reads above throws for a block in an unloaded chunk or outside
    // the world. A cell we cannot inspect is a cell we do not touch.
    return "skip";
  }
}
