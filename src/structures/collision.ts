// Collision heuristic (L0-strf-r006, L0-strf-d004). Stable 2.10.0 cannot say
// whether a vanilla structure stands somewhere, so a candidate's AABB plus the
// margin is searched for blocks that terrain generation never produces there:
// spawners, vanilla-structure signatures and player-made blocks. Any hit
// cancels the candidate; a recognisable player build is never overwritten.

import type { DimShort, Registry, Vec3 } from "./registry";
import { COLLISION_MARGIN } from "./registry";
import type { BlockView } from "./site";

export type CollisionKind = "instance" | "spawner" | "signature" | "player";

export interface ScanRule {
  kind: Exclude<CollisionKind, "instance">;
  types: readonly string[];
  /** Only in these dimensions; all when absent. */
  dims?: readonly DimShort[];
  /** The rule covers only this Y band of the box: below it the block occurs naturally. */
  minY?: number;
  maxY?: number;
}

const COLORS = [
  "white", "orange", "magenta", "light_blue", "yellow", "lime", "pink", "gray",
  "light_gray", "cyan", "purple", "blue", "brown", "green", "red", "black",
];
const WOODS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "mangrove", "cherry", "pale_oak", "bamboo", "crimson", "warped"];
const mc = (id: string): string => `minecraft:${id}`;

/**
 * Ids the running engine does not know are dropped by the adapter before the
 * query, so a list entry from a newer or older game version is harmless.
 */
export const SCAN_RULES: readonly ScanRule[] = [
  { kind: "spawner", types: ["mob_spawner", "trial_spawner"].map(mc) },
  {
    kind: "signature",
    types: [
      "deepslate_tiles", "cracked_deepslate_tiles", "deepslate_bricks", "cracked_deepslate_bricks", "chiseled_deepslate",
      "reinforced_deepslate", "polished_blackstone_bricks", "cracked_polished_blackstone_bricks", "chiseled_polished_blackstone",
      "gilded_blackstone", "nether_bricks", "cracked_nether_bricks", "chiseled_nether_bricks", "red_nether_bricks", "nether_brick_fence",
      "stone_bricks", "mossy_stone_bricks", "cracked_stone_bricks", "chiseled_stone_bricks", "end_portal_frame", "bell",
      "rail", "golden_rail", "detector_rail", "activator_rail", "tuff_bricks", "chiseled_tuff", "chiseled_tuff_bricks", "polished_tuff",
      "vault", "suspicious_sand", "suspicious_gravel", "cut_sandstone", "chiseled_sandstone", "lectern", "composter", "hay_block",
    ].map(mc),
  },
  {
    kind: "player",
    types: [
      ...WOODS.map((w) => `${w}_planks`),
      ...WOODS.filter((w) => w !== "bamboo").map((w) => `${w}_fence`),
      ...WOODS.map((w) => `${w}_stairs`),
      ...WOODS.map((w) => `${w}_door`),
      "wooden_door", "iron_door", "planks", "fence",
      ...COLORS.flatMap((c) => [`${c}_wool`, `${c}_carpet`, `${c}_concrete`, `${c}_stained_glass`, `${c}_stained_glass_pane`, `${c}_bed`]),
      "chest", "trapped_chest", "barrel", "ender_chest", "crafting_table", "furnace", "lit_furnace", "blast_furnace", "smoker",
      "torch", "lantern", "glass", "glass_pane", "bed", "ladder", "bookshelf", "bricks", "brick_block", "anvil", "enchanting_table",
      "smooth_stone", "stonecutter_block", "loom", "cartography_table", "smithing_table", "fletching_table", "brewing_stand",
      "iron_block", "gold_block", "diamond_block", "emerald_block", "netherite_block",
      "hopper", "dropper", "dispenser", "crafter", "decorated_pot", "frame", "glow_frame",
      "shulker_box", "undyed_shulker_box", ...COLORS.map((c) => `${c}_shulker_box`),
    ].map(mc),
  },
  // Cobblestone forms where lava meets water in deep caves; near the surface
  // and in the air it is a build.
  { kind: "player", types: ["cobblestone", "mossy_cobblestone"].map(mc), dims: ["o"], minY: 0 },
];

export interface Box {
  min: Vec3;
  max: Vec3;
}

/** Inclusive corners of the AABB grown by `margin` on all six sides. */
export function collisionBox(origin: Vec3, size: Vec3, margin = COLLISION_MARGIN): Box {
  return {
    min: [origin[0] - margin, origin[1] - margin, origin[2] - margin],
    max: [origin[0] + size[0] - 1 + margin, origin[1] + size[1] - 1 + margin, origin[2] + size[2] - 1 + margin],
  };
}

export type ScanResult = { kind: "clear" } | { kind: "hit"; collision: CollisionKind } | { kind: "unloaded" };

/**
 * Dense engine-side search of the box, one query per rule, spawners first.
 * The view clips each query to the world's height range.
 */
export function scanCollision(view: BlockView, dim: DimShort, box: Box, rules: readonly ScanRule[] = SCAN_RULES): ScanResult {
  for (const rule of rules) {
    if (rule.dims !== undefined && !rule.dims.includes(dim)) continue;
    const lo = Math.max(box.min[1], rule.minY ?? -Infinity);
    const hi = Math.min(box.max[1], rule.maxY ?? Infinity);
    if (lo > hi) continue;
    const found = view.contains([box.min[0], lo, box.min[2]], [box.max[0], hi, box.max[2]], rule.types);
    if (found === undefined) return { kind: "unloaded" };
    if (found) return { kind: "hit", collision: rule.kind };
  }
  return { kind: "clear" };
}

/** Registry records within the margin, the candidate's own record excepted. */
export function instanceCollision(registry: Registry, dim: DimShort, origin: Vec3, size: Vec3, selfId?: string): string | undefined {
  return registry.recordsOverlapping(dim, origin, size, COLLISION_MARGIN).find((r) => r.id !== selfId)?.id;
}
