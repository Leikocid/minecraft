// The charge contract between the Cannon core and its effects (L0-orbc-r014),
// and what a charge counts as a block (L0-orbc-r008, L0-orbc-as03).
//
// Type-only imports: node tests bundle this file without stubbing
// @minecraft/server, and a runtime import would make the stub throw.

import type { Block, Dimension, Vector3 } from "@minecraft/server";

export type Mode = "lmb" | "rmb";

export interface Column {
  x: number;
  z: number;
}

export interface Effect {
  /** Charge columns (x,z) for an attack locked on `target`. LMB: [target.xz]. */
  layout(target: Vector3): Column[];
  /** Called once per charge at its contact cell. Must be synchronous-safe; heavy work goes to its own bounded runJob. */
  onDetonate(dim: Dimension, point: Vector3, ownerId: string, mode: Mode, attackId: string): void;
  /** 1.2× TNT for LMB, 1.0× for RMB. */
  scale: 0 | 1;
}

const effects = new Map<Mode, Effect>();

/** A later registration for the same mode replaces the earlier one: that is how real effects take over from the stub. */
export function registerEffect(mode: Mode, effect: Effect): void {
  effects.set(mode, effect);
}

export function effectFor(mode: Mode): Effect | undefined {
  return effects.get(mode);
}

export const CHARGE_ENTITY_ID = "andrew:orbital_charge";
export const CHARGE_TAG = "andrew:oc_charge";

export function attackTag(attackId: string): string {
  return `andrew:oc_attack:${attackId}`;
}

/** Spawn events of packs/behavior/entities/orbital_charge.json, indexed by `Effect.scale`. */
export const SCALE_SPAWN_EVENTS: Readonly<Record<0 | 1, string>> = {
  0: "andrew:scale_rmb",
  1: "andrew:scale_lmb",
};

const FLOWERS = [
  "dandelion",
  "poppy",
  "blue_orchid",
  "allium",
  "azure_bluet",
  "red_tulip",
  "orange_tulip",
  "white_tulip",
  "pink_tulip",
  "oxeye_daisy",
  "cornflower",
  "lily_of_the_valley",
  "wither_rose",
  "torchflower",
  "sunflower",
  "lilac",
  "rose_bush",
  "peony",
  "pitcher_plant",
  "pink_petals",
  "wildflowers",
  "open_eyeblossom",
  "closed_eyeblossom",
  "cactus_flower",
];

const SAPLINGS = [
  "oak_sapling",
  "spruce_sapling",
  "birch_sapling",
  "jungle_sapling",
  "acacia_sapling",
  "dark_oak_sapling",
  "cherry_sapling",
  "pale_oak_sapling",
  "mangrove_propagule",
  "bamboo_sapling",
];

const LIGHT_BLOCKS = Array.from({ length: 16 }, (_, level) => `light_block_${level}`);

/**
 * Blocks a falling charge and the target ray pass through (L0-orbc-as03).
 * A closed list: anything absent is a contact block, leaves, glass, slabs,
 * carpets, fences and barriers included.
 */
export const PASS_THROUGH: ReadonlySet<string> = new Set(
  [
    "short_grass",
    "tall_grass",
    "short_dry_grass",
    "tall_dry_grass",
    "bush",
    "firefly_bush",
    "fern",
    "large_fern",
    "deadbush",
    ...FLOWERS,
    ...SAPLINGS,
    "torch",
    "soul_torch",
    "copper_torch",
    "redstone_torch",
    "unlit_redstone_torch",
    "underwater_torch",
    "colored_torch_red",
    "colored_torch_green",
    "colored_torch_blue",
    "colored_torch_purple",
    "rail",
    "golden_rail",
    "detector_rail",
    "activator_rail",
    "redstone_wire",
    "vine",
    "weeping_vines",
    "twisting_vines",
    "cave_vines",
    "cave_vines_body_with_berries",
    "cave_vines_head_with_berries",
    "web",
    "reeds",
    "kelp",
    "seagrass",
    "fire",
    "soul_fire",
    "structure_void",
    ...LIGHT_BLOCKS,
  ].map((id) => `minecraft:${id}`)
);

const SNOW_LAYER = "minecraft:snow_layer";

/** What isContact reads from a block. A structural subset, so tests can pass plain objects. */
export type ContactProbe = Pick<Block, "isAir" | "isLiquid" | "typeId"> & {
  permutation: Pick<Block["permutation"], "getState">;
};

/**
 * Whether a charge stops in this cell (L0-orbc-r008): not air, not a liquid,
 * not pass-through. A snow layer passes only at one layer — its `height`
 * state counts from 0.
 */
export function isContact(block: ContactProbe): boolean {
  if (block.isAir || block.isLiquid) return false;
  if (block.typeId === SNOW_LAYER) return block.permutation.getState("height") !== 0;
  return !PASS_THROUGH.has(block.typeId);
}
