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
  /**
   * Blocks: a target nearer than this is refused, silently and without a
   * cooldown, exactly like one out of range. The effect declares it because the
   * reason is the effect's own blast field — the rings reach the shooter, the
   * penetrator does no entity damage at all.
   */
  minRange?: number;
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

const ATTACK_TAG_PREFIX = "andrew:oc_attack:";

export function attackTag(attackId: string): string {
  return `${ATTACK_TAG_PREFIX}${attackId}`;
}

/** The attack id an `andrew:oc_attack:<id>` tag names, or undefined for any other tag. */
export function attackIdOfTag(tag: string): string | undefined {
  return tag.startsWith(ATTACK_TAG_PREFIX) ? tag.slice(ATTACK_TAG_PREFIX.length) : undefined;
}

/** Attack ids are `<scope>-<tick>-<seq>`; the scope names the script runtime that fired it. */
export function scopeOfAttack(attackId: string): string {
  const dash = attackId.indexOf("-");
  return dash < 0 ? attackId : attackId.slice(0, dash);
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

/** Blocks per tick, constant (L0-orbc-as02). A tuning value: the sweep keeps contact exact at any speed. */
export const FALL_SPEED = 1.0;

/**
 * The cells a charge enters when its feet go from `y` down to `ny`, top
 * first: `floor(y) − 1` down to `floor(ny)` (L0-orbc-p002 step 3). Cells
 * below `minY` do not exist and are never listed.
 */
export function sweepCells(y: number, ny: number, minY: number): number[] {
  const cells: number[] = [];
  const last = Math.max(Math.floor(ny), minY);
  for (let cell = Math.floor(y) - 1; cell >= last; cell--) cells.push(cell);
  return cells;
}

export type CellRead = "contact" | "clear" | "unloaded";

export type FallStep =
  | { kind: "contact"; cellY: number }
  | { kind: "lost"; cellY: number }
  | { kind: "void" }
  | { kind: "move"; y: number };

/**
 * One tick of one charge (L0-orbc-p002 steps 2–7) over a cell reader. The
 * first contact cell top-down wins; an unloaded cell met before one makes
 * the charge lost, since what lies in it is unknown.
 */
export function fallStep(y: number, minY: number, read: (cellY: number) => CellRead, speed: number = FALL_SPEED): FallStep {
  const ny = y - speed;
  for (const cellY of sweepCells(y, ny, minY)) {
    const cell = read(cellY);
    if (cell === "contact") return { kind: "contact", cellY };
    if (cell === "unloaded") return { kind: "lost", cellY };
  }
  return ny < minY ? { kind: "void" } : { kind: "move", y: ny };
}
