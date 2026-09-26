// The Mini Bastion template (§14.1, §14.3, §14.4; L0-bast-r002..r004): one
// fixed compact Bastion Remnant, compiled by scripts/build-structures.mjs into
// packs/behavior/structures/andrew/bastion.mcstructure (engine id
// "andrew:bastion"). Only rotation varies at placement.
//
// Template-local axes: x west→east, y up, z north→south; 20×12×20. A player
// stands at three heights (feet y): the lava hall at 2, the main level at 5,
// the rooftop terrace at 9. The treasure room is an island in the middle of
// the lava hall, under a drop opening in the main floor, ringed by a two-wide
// moat of lava source blocks. Stairs join hall↔main (south-west) and
// main↔roof (north-east); a ladder climbs from the island to the main floor.
//
// Pure data, no @minecraft/server: the GameTest pack imports the named points
// below, node evaluates the default export at build time.

import type { TemplateBlock } from "./windmill-fields";
import { noise } from "./windmill-fields";

export type Point = readonly [number, number, number];
type Facing = "north" | "east" | "south" | "west";
interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

export const BASTION_ID = "andrew:bastion";
export const BASTION_SIZE: Point = [20, 12, 20];

/** Feet height of each walkable level. */
export const LEVEL_FEET = { hall: 2, main: 5, roof: 9 } as const;

/** The treasure island: its top is y = 1, a player stands on it at y = 2. */
export const TREASURE: Box = { x0: 6, x1: 13, y0: 2, y1: 3, z0: 6, z1: 13 };
/** Lava source blocks at y = 1: the ring between these bounds and the island. */
export const MOAT: Box = { x0: 4, x1: 15, y0: 1, y1: 1, z0: 4, z1: 15 };
/** The hole in the main floor (y = 4) over the island; it keeps two blocks clear of the lava. */
export const DROP: Box = { x0: 8, x1: 11, y0: 4, y1: 4, z0: 8, z1: 11 };
/** Ladder cells from the island up into the drop opening, on a pillar to their north. */
export const LADDER: readonly Point[] = [
  [9, 2, 8],
  [9, 3, 8],
  [9, 4, 8],
];

/** Bedrock stairs weirdo_direction: the side a stair climbs towards. */
const WEIRDO = { east: 0, west: 1, south: 2, north: 3 } as const;

/** Every stair block, bottom to top per flight. */
export const STAIRS: readonly { at: Point; climbs: keyof typeof WEIRDO }[] = [
  // gate: outside ground (feet 0 below the template) up into the hall
  { at: [9, 0, 19], climbs: "north" },
  { at: [10, 0, 19], climbs: "north" },
  { at: [9, 1, 18], climbs: "north" },
  { at: [10, 1, 18], climbs: "north" },
  // hall → main, along the west wall
  { at: [1, 2, 14], climbs: "north" },
  { at: [2, 2, 14], climbs: "north" },
  { at: [1, 3, 13], climbs: "north" },
  { at: [2, 3, 13], climbs: "north" },
  { at: [1, 4, 12], climbs: "north" },
  { at: [2, 4, 12], climbs: "north" },
  // main → roof, along the east wall
  { at: [17, 5, 5], climbs: "south" },
  { at: [18, 5, 5], climbs: "south" },
  { at: [17, 6, 6], climbs: "south" },
  { at: [18, 6, 6], climbs: "south" },
  { at: [17, 7, 7], climbs: "south" },
  { at: [18, 7, 7], climbs: "south" },
  { at: [17, 8, 8], climbs: "south" },
  { at: [18, 8, 8], climbs: "south" },
];

/**
 * Floor cells cut away for head room over the stairs, including the cell
 * before each first step: a player's box straddles both columns while it
 * steps up, so a ceiling right over the approach blocks the climb.
 */
const STAIRWELLS: readonly Point[] = [
  [1, 4, 15],
  [2, 4, 15],
  [1, 4, 13],
  [2, 4, 13],
  [1, 4, 14],
  [2, 4, 14],
  [17, 8, 5],
  [18, 8, 5],
  [17, 8, 6],
  [18, 8, 6],
  [17, 8, 7],
  [18, 8, 7],
];

/** Three on the treasure island, seven through the hall, the main rooms and the roof. */
export const CHESTS: readonly { at: Point; facing: Facing; zone: "treasure" | "other" }[] = [
  { at: [6, 2, 10], facing: "east", zone: "treasure" },
  { at: [13, 2, 10], facing: "west", zone: "treasure" },
  { at: [10, 2, 13], facing: "north", zone: "treasure" },
  { at: [18, 2, 1], facing: "south", zone: "other" },
  { at: [1, 2, 18], facing: "north", zone: "other" },
  { at: [1, 5, 1], facing: "south", zone: "other" },
  { at: [10, 5, 1], facing: "south", zone: "other" },
  { at: [18, 5, 18], facing: "north", zone: "other" },
  { at: [1, 9, 1], facing: "south", zone: "other" },
  { at: [10, 9, 18], facing: "north", zone: "other" },
];

/**
 * Gold blocks on the island's corners. The template carries all four; the
 * body keeps treasureGoldKept(roll) of them at creation and clears the rest,
 * which gives the random 2–4 of §14.3.
 */
export const TREASURE_GOLD: readonly Point[] = [
  [6, 2, 6],
  [13, 2, 13],
  [13, 2, 6],
  [6, 2, 13],
];

/** The gold slots to keep for a roll in [0, 1): the first 2, 3 or 4, uniformly. */
export function treasureGoldKept(roll: number): readonly Point[] {
  const n = 2 + Math.min(2, Math.max(0, Math.floor(roll * 3)));
  return TREASURE_GOLD.slice(0, n);
}

/** Where the two Piglin Brutes stand (§14.5): one on the island, one on the main level. */
export const BRUTE_SLOTS: readonly { at: Point; slot: "treasure" | "other" }[] = [
  { at: [12, 2, 9], slot: "treasure" },
  { at: [15, 5, 9], slot: "other" },
];

const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;
const inBox = (b: Box, x: number, y: number, z: number): boolean =>
  x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;
const has = (list: readonly Point[], x: number, y: number, z: number): boolean => list.some((p) => p[0] === x && p[1] === y && p[2] === z);

const AIR: TemplateBlock = { name: "minecraft:air" };
const LAVA: TemplateBlock = { name: "minecraft:lava", states: { liquid_depth: 0 } };
const BLACKSTONE: TemplateBlock = { name: "minecraft:blackstone" };
const POLISHED: TemplateBlock = { name: "minecraft:polished_blackstone" };
const BRICKS: TemplateBlock = { name: "minecraft:polished_blackstone_bricks" };
const CRACKED: TemplateBlock = { name: "minecraft:cracked_polished_blackstone_bricks" };
const CHISELED: TemplateBlock = { name: "minecraft:chiseled_polished_blackstone" };
const GILDED: TemplateBlock = { name: "minecraft:gilded_blackstone" };
const BASALT: TemplateBlock = { name: "minecraft:polished_basalt", states: { pillar_axis: "y" } };
const GOLD: TemplateBlock = { name: "minecraft:gold_block" };
const LADDER_BLOCK: TemplateBlock = { name: "minecraft:ladder", states: { facing_direction: 3 } };

const [SX, SY, SZ] = BASTION_SIZE;
const outerRing = (x: number, z: number): boolean => x === 0 || z === 0 || x === SX - 1 || z === SZ - 1;
const corner = (x: number, z: number): boolean => (x === 0 || x === SX - 1) && (z === 0 || z === SZ - 1);

/** Partition walls: the two main-level rooms and the rooftop turret, each with a two-high doorway. */
const PARTITIONS: readonly { wall: Box; door?: Box }[] = [
  { wall: { x0: 6, x1: 6, y0: 5, y1: 7, z0: 1, z1: 6 }, door: { x0: 6, x1: 6, y0: 5, y1: 6, z0: 3, z1: 3 } },
  { wall: { x0: 1, x1: 6, y0: 5, y1: 7, z0: 6, z1: 6 } },
  { wall: { x0: 13, x1: 13, y0: 5, y1: 7, z0: 13, z1: 18 }, door: { x0: 13, x1: 13, y0: 5, y1: 6, z0: 16, z1: 16 } },
  { wall: { x0: 13, x1: 18, y0: 5, y1: 7, z0: 13, z1: 13 } },
  { wall: { x0: 6, x1: 6, y0: 9, y1: 10, z0: 1, z1: 6 }, door: { x0: 6, x1: 6, y0: 9, y1: 10, z0: 3, z1: 3 } },
  { wall: { x0: 1, x1: 6, y0: 9, y1: 10, z0: 6, z1: 6 } },
];
const TURRET_ROOF: Box = { x0: 1, x1: 6, y0: 11, y1: 11, z0: 1, z1: 6 };

/** Masonry for a wall cell: bricks with some cracks, a blackstone footing. */
function wallBlock(x: number, y: number, z: number): TemplateBlock {
  if (y <= 1) return BLACKSTONE;
  const n = noise(x, y, z, 41);
  return n < 0.16 ? CRACKED : n < 0.22 ? BLACKSTONE : BRICKS;
}

/** The outer face: a gilded band at y = 7 and gold on the corner merlons and over the gate. */
function outerBlock(x: number, y: number, z: number): TemplateBlock | undefined {
  const along = x === 0 || x === SX - 1 ? z : x;
  if (corner(x, z)) return y === 11 ? GOLD : y <= 1 ? BLACKSTONE : CHISELED;
  if (y === 7 && along % 4 === 2) return GILDED;
  if (y === 11) return along % 2 === 0 ? BRICKS : undefined;
  return wallBlock(x, y, z);
}

/** The whole template in the compileTemplate format of scripts/lib/mcstructure.mjs. */
export default function bastionTemplate(): {
  size: Point;
  blocks: Record<string, TemplateBlock>;
  layers: Record<string, string[]>;
} {
  const cells = new Map<string, TemplateBlock>();
  const get = (x: number, y: number, z: number): TemplateBlock => cells.get(key(x, y, z)) ?? AIR;
  const set = (x: number, y: number, z: number, b: TemplateBlock): void => {
    if (x < 0 || y < 0 || z < 0 || x >= SX || y >= SY || z >= SZ) throw new Error(`bastion: ${key(x, y, z)} outside the template`);
    cells.set(key(x, y, z), b);
  };

  for (let x = 0; x < SX; x++)
    for (let z = 0; z < SZ; z++) {
      if (outerRing(x, z)) {
        for (let y = 0; y < SY; y++) {
          const b = outerBlock(x, y, z);
          if (b) set(x, y, z, b);
        }
        continue;
      }
      // Hall floor, moat and island.
      set(x, 0, z, BLACKSTONE);
      const moat = inBox(MOAT, x, 1, z) && !inBox(TREASURE, x, 2, z);
      const island = inBox(TREASURE, x, 2, z);
      const rim = island && (x === TREASURE.x0 || x === TREASURE.x1 || z === TREASURE.z0 || z === TREASURE.z1);
      set(x, 1, z, moat ? LAVA : rim ? CHISELED : island ? BRICKS : POLISHED);
      // Main floor over the hall, the roof floor over the main level.
      if (!inBox(DROP, x, 4, z) && !has(STAIRWELLS, x, 4, z)) set(x, 4, z, POLISHED);
      if (!has(STAIRWELLS, x, 8, z)) set(x, 8, z, POLISHED);
    }

  // Basalt columns under the main floor at the hall's inner corners, clear of moat and paths.
  for (const [px, pz] of [[3, 3], [16, 3], [16, 16]]) for (let y = 2; y <= 3; y++) set(px, y, pz, BASALT);

  for (const p of PARTITIONS)
    for (let x = p.wall.x0; x <= p.wall.x1; x++)
      for (let y = p.wall.y0; y <= p.wall.y1; y++)
        for (let z = p.wall.z0; z <= p.wall.z1; z++) set(x, y, z, p.door && inBox(p.door, x, y, z) ? AIR : wallBlock(x, y, z));
  for (let x = TURRET_ROOF.x0; x <= TURRET_ROOF.x1; x++) for (let z = TURRET_ROOF.z0; z <= TURRET_ROOF.z1; z++) set(x, 11, z, POLISHED);

  // The gate in the south wall: two wide, three high, stepped up from outside.
  for (const x of [9, 10]) {
    for (let y = 1; y <= 3; y++) set(x, y, SZ - 1, AIR);
    set(x, 4, SZ - 1, GOLD);
  }

  for (const s of STAIRS) set(...s.at, { name: "minecraft:polished_blackstone_brick_stairs", states: { weirdo_direction: WEIRDO[s.climbs], upside_down_bit: false } });
  // Solid under the upper steps of each flight.
  for (const [x, y, z] of [[1, 2, 13], [2, 2, 13], [17, 5, 6], [18, 5, 6], [17, 5, 7], [18, 5, 7], [17, 6, 7], [18, 6, 7]] as const) set(x, y, z, BRICKS);

  // The ladder hangs on a pillar standing on the island's north side.
  for (let y = 2; y <= 3; y++) set(9, y, 7, POLISHED);
  for (const l of LADDER) set(...l, LADDER_BLOCK);

  for (const g of TREASURE_GOLD) set(...g, GOLD);
  for (const c of CHESTS) set(...c.at, { name: "minecraft:chest", states: { "minecraft:cardinal_direction": c.facing }, chest: { items: [] } });
  for (const c of CHESTS) if (get(c.at[0], c.at[1] + 1, c.at[2]) !== AIR) throw new Error(`bastion: chest ${key(...c.at)} cannot open`);
  for (const b of BRUTE_SLOTS)
    if (get(...b.at) !== AIR || get(b.at[0], b.at[1] + 1, b.at[2]) !== AIR) throw new Error(`bastion: brute slot ${key(...b.at)} is not open`);

  // Legend: '.' air, ' ' is not used (compileTemplate reads it as "leave as is"), others in order.
  const blocks: Record<string, TemplateBlock> = { ".": AIR };
  const charOf = new Map<string, string>([[JSON.stringify(AIR), "."]]);
  let next = 33;
  const legendChar = (b: TemplateBlock): string => {
    const id = JSON.stringify(b);
    let ch = charOf.get(id);
    if (ch === undefined) {
      if (next === 46) next++;
      if (next > 126) throw new Error("bastion: more distinct blocks than legend characters");
      ch = String.fromCharCode(next++);
      charOf.set(id, ch);
      blocks[ch] = b;
    }
    return ch;
  };

  const layers: Record<string, string[]> = {};
  for (let y = 0; y < SY; y++) {
    const rows: string[] = [];
    for (let z = 0; z < SZ; z++) {
      let row = "";
      for (let x = 0; x < SX; x++) row += legendChar(get(x, y, z));
      rows.push(row);
    }
    layers[String(y)] = rows;
  }
  return { size: BASTION_SIZE, blocks, layers };
}
