// Pure rules of a bound use (spec v3 §7, bound state; L0-xasm42, L0-pear-pr03, L0-pear-ru01, L0-pear-ru02): who
// travels, the outcome table, what the binding becomes after each outcome, and where a player may safely arrive.
// Values in, values out: no engine call, so tests/pearl-teleport.test.mjs bundles this file with esbuild.

import { type Binding, type Vec3, isPlateType } from "./bind-rules";
import { isHonoured } from "./owner-rules";

/** The preload gives up after 10 s (xasm42). The probe measured 2–31 ticks (Q5). */
export const PRELOAD_TIMEOUT_TICKS = 200;
/** A read-back further than this from the ordered point is not an arrival (L0-pear-pr03 §5). */
export const ARRIVAL_TOLERANCE = 0.5;
/** Probe Q6: 9 of 9 preloaded cross-dimension trips arrived and stayed, so another dimension is allowed (xq12 item 3). */
export const CROSS_DIMENSION_ALLOWED = true;
export const ARRIVAL_SOUND = "mob.endermen.portal";

/** What a use of a rod does, decided in beforeEvents.itemUse from the rod and the user alone. */
export type UseVerdict = "vanilla" | "travel" | "travelling";

export interface User {
  id: string;
  /** The user's current life epoch (`andrew:life_epoch`). */
  epoch: number;
}

/**
 * A binding is honoured only for its binder in the life it was made in (L0-pear-ru01 §1). Anyone else, or the binder
 * after a death, casts like a vanilla rod; their own hit then overwrites the record.
 */
export function useVerdict(binding: Binding | undefined, user: User, pending: boolean): UseVerdict {
  if (!isHonoured(binding, user)) return "vanilla";
  return pending ? "travelling" : "travel";
}

export type Outcome =
  | "arrived"
  | "plate-gone"
  | "not-loaded"
  | "busy"
  | "dimension-refused"
  | "unsafe"
  | "travelling"
  | "rod-left"
  | "failed"
  | "died"
  | "offline";

export interface OutcomeRule {
  /** The player was moved. */
  teleport: boolean;
  /** `clear` removes the record from the rod; `keep` leaves the rod untouched. */
  binding: "clear" | "keep";
  /** The actionbar line, a key in packs/resource/texts; undefined sends nothing. */
  message: string | undefined;
}

/**
 * xasm42, row by row, with L0-pear-pr03's two extra keep rows (the rod left the inventory, the read-back mismatched).
 * Only `arrived` moves the player and only `arrived` speaks of an arrival. A death voids the binding through the
 * epoch, not here; a logout ends the trip without a word because there is nobody to tell.
 */
export const OUTCOMES: Readonly<Record<Outcome, OutcomeRule>> = {
  arrived: { teleport: true, binding: "clear", message: "andrew.pearl_rod.arrived" },
  "plate-gone": { teleport: false, binding: "clear", message: "andrew.pearl_rod.plate_gone" },
  "not-loaded": { teleport: false, binding: "keep", message: "andrew.pearl_rod.not_loaded" },
  busy: { teleport: false, binding: "keep", message: "andrew.pearl_rod.busy" },
  "dimension-refused": { teleport: false, binding: "keep", message: "andrew.pearl_rod.dimension_refused" },
  unsafe: { teleport: false, binding: "keep", message: "andrew.pearl_rod.unsafe" },
  travelling: { teleport: false, binding: "keep", message: "andrew.pearl_rod.travelling" },
  "rod-left": { teleport: false, binding: "keep", message: "andrew.pearl_rod.rod_left" },
  failed: { teleport: false, binding: "keep", message: "andrew.pearl_rod.failed" },
  died: { teleport: false, binding: "keep", message: undefined },
  offline: { teleport: false, binding: "keep", message: undefined },
};

/** The first step of a trip, on the tick after the use: may the destination dimension be travelled to at all. */
export function dimensionVerdict(from: string, to: string, known: boolean, crossAllowed: boolean = CROSS_DIMENSION_ALLOWED): "go" | "dimension-refused" {
  if (!known) return "dimension-refused";
  return from === to || crossAllowed ? "go" : "dimension-refused";
}

export interface WaitState {
  /** The player entity is still valid (online). */
  online: boolean;
  /** No death since the use: health above 0, no entityDie, and the life epoch has not moved (`owner.ts` stillInLife). */
  alive: boolean;
  /** Every preload cell reads loaded and the plate cell answers getBlock. */
  loaded: boolean;
  tick: number;
  deadline: number;
}

/** One check of a pending trip in the shared interval. */
export function waitVerdict(s: WaitState): "offline" | "died" | "validate" | "not-loaded" | "wait" {
  if (!s.online) return "offline";
  if (!s.alive) return "died";
  if (s.loaded) return "validate";
  return s.tick >= s.deadline ? "not-loaded" : "wait";
}

export interface Destination {
  /** The rod, found by its id anywhere in the user's inventory, still carries this very binding. */
  rodFound: boolean;
  /** typeId at the bound cell; undefined when the cell does not answer. */
  cellType: string | undefined;
  /** The plate generation the world holds for the bound cell now (L0-pear-ent2). */
  gen: number;
  /** The first safe arrival cell, or undefined when none of the nine is safe. */
  spot: Vec3 | undefined;
}

/**
 * The loaded destination, checked in L0-pear-pr03 §4 order: the rod, then the plate (same type and generation,
 * L0-pear-ru03; the permutation is ignored because `redstone_signal` changes on every press), then a safe spot.
 */
export function destinationVerdict(binding: Binding, d: Destination): "rod-left" | "not-loaded" | "plate-gone" | "unsafe" | "teleport" {
  if (!d.rodFound) return "rod-left";
  if (d.cellType === undefined) return "not-loaded";
  if (d.cellType !== binding.type || !isPlateType(d.cellType) || d.gen !== binding.gen) return "plate-gone";
  return d.spot === undefined ? "unsafe" : "teleport";
}

/** The read-back of L0-pear-pr03 §5: the same dimension and within ARRIVAL_TOLERANCE of the ordered point. */
export function arrivalVerdict(want: Vec3, wantDim: string, gotDim: string, got: Vec3): "arrived" | "failed" {
  const off = Math.hypot(got.x - want.x, got.y - want.y, got.z - want.z);
  return gotDim === wantDim && off < ARRIVAL_TOLERANCE ? "arrived" : "failed";
}

// ------------------------------------------------------------------ the preload (L0-pear-pr03 §2–§3)

/** The ticking area: the plate's column and its 8 neighbours', which is every column the safe-spot search reads. */
export function preloadBox(plate: Vec3): { min: [number, number]; max: [number, number] } {
  return { min: [plate.x - 1, plate.z - 1], max: [plate.x + 1, plate.z + 1] };
}

export function preloadCells(plate: Vec3): Vec3[] {
  const out: Vec3[] = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) out.push({ x: plate.x + dx, y: plate.y, z: plate.z + dz });
  return out;
}

// ------------------------------------------------------------------ the safe spot (L0-pear-ru02)

/** N, E, S, W, NE, SE, SW, NW; north is −z. Fixed so a test can predict the cell. */
export const NEIGHBOUR_ORDER: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
  [1, -1],
  [1, 1],
  [-1, 1],
  [-1, -1],
];

/** The plate cell first, then its 8 horizontal neighbours. No vertical search: §7 says "над ней или рядом". */
export function spotCandidates(plate: Vec3): Vec3[] {
  return [plate, ...NEIGHBOUR_ORDER.map(([dx, dz]) => ({ x: plate.x + dx, y: plate.y, z: plate.z + dz }))];
}

/** What the safe-spot rule reads of one block; undefined when the cell does not answer (unloaded, out of range). */
export interface CellRead {
  typeId: string;
  isAir: boolean;
  isLiquid: boolean;
  isWaterlogged: boolean;
  /** `height` of a snow layer, 0 = one layer; undefined for every other block. */
  snowHeight?: number;
}

/** Collision-free blocks a player stands in safely. Stable 2.10.0 has no runtime isSolid, so this is a typeId list. */
const PASSABLE_IDS = new Set(
  [
    "short_grass",
    "tall_grass",
    "fern",
    "large_fern",
    "short_dry_grass",
    "tall_dry_grass",
    "bush",
    "firefly_bush",
    "deadbush",
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
    "torchflower",
    "sunflower",
    "lilac",
    "rose_bush",
    "peony",
    "pitcher_plant",
    "pink_petals",
    "wildflowers",
    "leaf_litter",
    "open_eyeblossom",
    "closed_eyeblossom",
  ].map((id) => `minecraft:${id}`)
);
const PASSABLE_SUFFIXES = ["pressure_plate", "carpet", "_sign", "torch", "button"];

export function isPassable(c: CellRead | undefined): boolean {
  if (c === undefined || c.isLiquid || c.isWaterlogged) return false;
  if (c.isAir) return true;
  if (!c.typeId.startsWith("minecraft:")) return false;
  if (c.typeId === "minecraft:snow_layer") return c.snowHeight === 0;
  if (c.typeId.startsWith("minecraft:light_block")) return true;
  return PASSABLE_IDS.has(c.typeId) || PASSABLE_SUFFIXES.some((s) => c.typeId.endsWith(s));
}

/** Floors that hurt, hold nobody up, or leave the feet inside their collision. */
const BAD_FLOOR_IDS = new Set(
  [
    "magma",
    "campfire",
    "soul_campfire",
    "cactus",
    "powder_snow",
    "scaffolding",
    "fire",
    "soul_fire",
    "lava",
    "flowing_lava",
    "water",
    "flowing_water",
    "sweet_berry_bush",
    "wither_rose",
    "web",
    "pointed_dripstone",
    "ladder",
    "vine",
  ].map((id) => `minecraft:${id}`)
);
const BAD_FLOOR_SUFFIXES = ["_fence", "fence_gate", "_wall", "trapdoor", "_door", "rail"];

export function isSolidFloor(c: CellRead | undefined): boolean {
  if (c === undefined || c.isAir || c.isLiquid || isPassable(c)) return false;
  return !BAD_FLOOR_IDS.has(c.typeId) && !BAD_FLOOR_SUFFIXES.some((s) => c.typeId.endsWith(s));
}

export interface HeightRange {
  min: number;
  /** Exclusive, as `Dimension.heightRange.max` reads. */
  max: number;
}

/**
 * Feet and head passable, a solid floor under the feet, all three inside the dimension. That rules out lava, fire,
 * water and every other liquid in the body, a block in the head (suffocation), and air or a hazard underfoot (the void).
 */
export function isSafeSpot(feet: Vec3, read: (at: Vec3) => CellRead | undefined, range: HeightRange): boolean {
  if (feet.y - 1 < range.min || feet.y + 1 >= range.max) return false;
  const at = (dy: number): CellRead | undefined => read({ x: feet.x, y: feet.y + dy, z: feet.z });
  return isPassable(at(0)) && isPassable(at(1)) && isSolidFloor(at(-1));
}

/** The first safe candidate, in spotCandidates order. */
export function findSafeSpot(plate: Vec3, read: (at: Vec3) => CellRead | undefined, range: HeightRange): Vec3 | undefined {
  return spotCandidates(plate).find((c) => isSafeSpot(c, read, range));
}

/** Feet on the floor at the cell's centre. The facing is left as it is. */
export function arrivalPoint(cell: Vec3): Vec3 {
  return { x: cell.x + 0.5, y: cell.y, z: cell.z + 0.5 };
}
