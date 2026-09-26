// The Windmill template (§4.1–§4.4, L0-wind-r001): one fixed building on one
// fixed plot, compiled by scripts/build-structures.mjs into
// packs/behavior/structures/andrew/windmill.mcstructure (engine id
// "andrew:windmill"). Only rotation varies at placement.
//
// Template-local axes: x west→east, y up, z north→south. The front face — rotor
// and door — is the north wall (z = BUILDING.z0).
//
// Pure data, no @minecraft/server: the GameTest pack imports the named points
// below, node evaluates the default export at build time.

import { BUILDING, PLOT, type TemplateBlock, fieldCell, noise } from "./windmill-fields";

export type Point = readonly [number, number, number];

export const WINDMILL_ID = "andrew:windmill";
export const WINDMILL_SIZE: Point = [PLOT, 31, PLOT];

/** Slab level of each floor; players stand one block above it. */
export const FLOOR_SLAB_Y = [0, 7, 14] as const;
const WALL_TOP_Y = 21;
const ROOF_BASE_Y = 22;

const IX0 = BUILDING.x0 + 1;
const IX1 = BUILDING.x1 - 1;
const IZ0 = BUILDING.z0 + 1;
const IZ1 = BUILDING.z1 - 1;

export const DOOR_LOWER: Point = [17, 1, BUILDING.z0];
export const DOOR_UPPER: Point = [17, 2, BUILDING.z0];

/** Bedrock stairs weirdo_direction: the side a stair climbs towards. */
const WEIRDO = { east: 0, west: 1, south: 2, north: 3 } as const;

/**
 * The one stair, bottom to top: up the east wall southwards from floor 1,
 * passing floor 2 level at its 7th step, then west along the south wall onto
 * floor 3. Consecutive steps are neighbours one block apart and one higher.
 */
export const STAIR_STEPS: readonly { at: Point; climbs: keyof typeof WEIRDO }[] = [
  ...Array.from({ length: 12 }, (_, i) => ({ at: [IX1, 1 + i, IZ0 + 1 + i] as Point, climbs: "south" as const })),
  { at: [IX1 - 1, 13, IZ1], climbs: "west" },
  { at: [IX1 - 2, 14, IZ1], climbs: "west" },
];

/** Floor 2 is left sideways from the stair step that is level with it. */
export const FLOOR2_EXIT: Point = [IX1 - 1, 8, IZ0 + 7];

type Facing = "north" | "east" | "south" | "west";

/** 25 single chests (§4.3): no two share a side, so none can pair into a double chest. */
export const CHESTS: readonly (readonly { at: Point; facing: Facing }[])[] = [
  [
    { at: [11, 1, 13], facing: "east" },
    { at: [11, 1, 17], facing: "east" },
    { at: [15, 1, 24], facing: "north" },
    { at: [19, 1, 24], facing: "north" },
    { at: [21, 1, 13], facing: "west" },
  ],
  [
    { at: [11, 8, 13], facing: "east" },
    { at: [11, 8, 16], facing: "east" },
    { at: [11, 8, 19], facing: "east" },
    { at: [14, 8, 24], facing: "north" },
    { at: [17, 8, 24], facing: "north" },
    { at: [20, 8, 24], facing: "north" },
    { at: [14, 8, 12], facing: "south" },
    { at: [20, 8, 12], facing: "south" },
  ],
  [
    { at: [11, 15, 12], facing: "south" },
    { at: [13, 15, 12], facing: "south" },
    { at: [15, 15, 12], facing: "south" },
    { at: [17, 15, 12], facing: "south" },
    { at: [19, 15, 12], facing: "south" },
    { at: [11, 15, 15], facing: "east" },
    { at: [11, 15, 17], facing: "east" },
    { at: [11, 15, 19], facing: "east" },
    { at: [11, 15, 21], facing: "east" },
    { at: [23, 15, 15], facing: "west" },
    { at: [23, 15, 17], facing: "west" },
    { at: [23, 15, 19], facing: "west" },
  ],
];

/** One vanilla spawner per floor, in the dark south-west quarter away from the lanterns. */
export const SPAWNERS: readonly { at: Point; entity: string }[] = [
  { at: [13, 1, 21], entity: "minecraft:zombie_villager_v2" },
  { at: [13, 8, 21], entity: "minecraft:zombie" },
  { at: [14, 15, 21], entity: "minecraft:vindicator" },
];

/** Lanterns sit in the north-east corners, far enough that no spawner zone exceeds Lmax. */
export const LANTERNS: readonly { at: Point; hanging: boolean }[] = [
  { at: [22, 6, 12], hanging: true },
  { at: [12, 6, 12], hanging: true },
  { at: [22, 13, 12], hanging: true },
  { at: [12, 13, 12], hanging: true },
  { at: [22, 15, 12], hanging: false },
];

/** Rotor hub on the front face; four fixed blades around it (§4.1). */
export const HUB: Point = [17, 18, BUILDING.z0 - 1];
export const BLADE_SPAR = "minecraft:birch_fence";
export const BLADE_SAIL = "minecraft:birch_planks";

type Cells = Map<string, TemplateBlock>;
const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;

const AIR: TemplateBlock = { name: "minecraft:air" };
const stone = (x: number, y: number, z: number): TemplateBlock => {
  const r = noise(x, y, z, 21);
  if (r < 0.15) return { name: "minecraft:mossy_cobblestone" };
  if (r < 0.3) return { name: "minecraft:cracked_stone_bricks" };
  if (r < 0.42) return { name: "minecraft:mossy_stone_bricks" };
  if (r < 0.65) return { name: "minecraft:cobblestone" };
  return { name: "minecraft:stone_bricks" };
};
const plank = (x: number, y: number, z: number): TemplateBlock =>
  noise(x, y, z, 22) < 0.2 ? { name: "minecraft:spruce_planks" } : { name: "minecraft:oak_planks" };
const log = (name: string, axis: "x" | "y" | "z"): TemplateBlock => ({ name, states: { pillar_axis: axis } });
const vine = (bits: number): TemplateBlock => ({ name: "minecraft:vine", states: { vine_direction_bits: bits } });
const WEB: TemplateBlock = { name: "minecraft:web" };

/** Bedrock vine_direction_bits: the side of the cell the supporting block is on. */
const VINE_BIT = { south: 1, west: 2, north: 4, east: 8 } as const;

function building(set: (x: number, y: number, z: number, b: TemplateBlock) => void): void {
  const { x0, x1, z0, z1 } = BUILDING;
  for (let y = 0; y <= WALL_TOP_Y; y++)
    for (let x = x0; x <= x1; x++)
      for (let z = z0; z <= z1; z++) {
        const wall = x === x0 || x === x1 || z === z0 || z === z1;
        const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
        const slab = (FLOOR_SLAB_Y as readonly number[]).includes(y);
        if (y <= FLOOR_SLAB_Y[1]) set(x, y, z, wall || slab ? (y === FLOOR_SLAB_Y[1] && !wall ? plank(x, y, z) : stone(x, y, z)) : AIR);
        else if (corner) set(x, y, z, log("minecraft:spruce_log", "y"));
        else if (wall && y === FLOOR_SLAB_Y[2]) set(x, y, z, log("minecraft:stripped_spruce_log", x === x0 || x === x1 ? "z" : "x"));
        else if (wall) set(x, y, z, plank(x, y, z));
        else if (slab) set(x, y, z, { name: "minecraft:spruce_planks" });
        else set(x, y, z, AIR);
      }

  // Gable roof along x, closed at both ends; the attic under it is open to floor 3.
  for (let k = 0; ROOF_BASE_Y + k <= 29; k++) {
    const y = ROOF_BASE_Y + k;
    for (let x = x0; x <= x1; x++)
      for (let z = z0 + k; z <= z1 - k; z++) {
        const skin = z === z0 + k || z === z1 - k || x === x0 || x === x1;
        set(x, y, z, skin ? { name: "minecraft:spruce_planks" } : AIR);
      }
  }
  for (let x = x0 - 1; x <= x1 + 1; x++) set(x, 30, (z0 + z1) / 2, log("minecraft:dark_oak_log", "x"));

  // Ceiling beams across each lower floor.
  for (const y of [FLOOR_SLAB_Y[1] - 1, FLOOR_SLAB_Y[2] - 1]) for (let x = IX0; x <= IX1 - 1; x++) set(x, y, 18, log("minecraft:spruce_log", "x"));

  set(...DOOR_LOWER, { name: "minecraft:wooden_door", states: { upper_block_bit: false, "minecraft:cardinal_direction": "south", open_bit: false, door_hinge_bit: false } });
  set(...DOOR_UPPER, { name: "minecraft:wooden_door", states: { upper_block_bit: true, "minecraft:cardinal_direction": "south", open_bit: false, door_hinge_bit: false } });

  const pane: TemplateBlock = { name: "minecraft:glass_pane" };
  for (const [x, y, z] of [[13, 10, z0], [21, 10, z0], [13, 17, z0], [21, 17, z0], [x1, 10, 14], [x1, 17, 13]] as Point[]) set(x, y, z, pane);
}

function stair(set: (x: number, y: number, z: number, b: TemplateBlock) => void): void {
  for (const s of STAIR_STEPS) {
    set(...s.at, { name: "minecraft:spruce_stairs", states: { weirdo_direction: WEIRDO[s.climbs], upside_down_bit: false } });
    // Headroom, slabs included: two cells for the player on the step, and a
    // third because a 1.8-high player climbing to the next step pokes into it.
    for (let dy = 1; dy <= 3; dy++) set(s.at[0], s.at[1] + dy, s.at[2], AIR);
  }
}

function rotor(set: (x: number, y: number, z: number, b: TemplateBlock) => void): void {
  const [hx, hy, hz] = HUB;
  set(hx, hy, hz, log("minecraft:dark_oak_log", "z"));
  const spar: TemplateBlock = { name: BLADE_SPAR };
  const sail: TemplateBlock = { name: BLADE_SAIL };
  // Each blade: an 8-long spar and a 6-long sail on its clockwise side, starting
  // 3 from the hub so neighbouring blades never touch.
  const arms: [number, number, number, number][] = [
    [0, 1, 1, 0],
    [1, 0, 0, -1],
    [0, -1, -1, 0],
    [-1, 0, 0, 1],
  ];
  for (const [dx, dy, sx, sy] of arms) {
    for (let i = 1; i <= 8; i++) set(hx + dx * i, hy + dy * i, hz, spar);
    for (let i = 3; i <= 8; i++) set(hx + dx * i + sx, hy + dy * i + sy, hz, sail);
  }
}

/** Cells decay must never occupy: the door, every stair step and its headroom, every chest and the cell above it. */
export function routeCells(): Set<string> {
  const out = new Set<string>();
  const add = (x: number, y: number, z: number): void => void out.add(key(x, y, z));
  add(...DOOR_LOWER);
  add(...DOOR_UPPER);
  add(DOOR_LOWER[0], 1, DOOR_LOWER[2] + 1);
  add(DOOR_LOWER[0], 2, DOOR_LOWER[2] + 1);
  for (const s of STAIR_STEPS) for (let dy = 0; dy <= 3; dy++) add(s.at[0], s.at[1] + dy, s.at[2]);
  for (const floor of CHESTS) for (const c of floor) for (let dy = 0; dy <= 1; dy++) add(c.at[0], c.at[1] + dy, c.at[2]);
  return out;
}

function decay(cells: Cells, set: (x: number, y: number, z: number, b: TemplateBlock) => void): void {
  const keep = routeCells();
  const isAir = (x: number, y: number, z: number): boolean => (cells.get(key(x, y, z)) ?? AIR).name === "minecraft:air";
  const put = (x: number, y: number, z: number, b: TemplateBlock): void => {
    if (!keep.has(key(x, y, z)) && isAir(x, y, z)) set(x, y, z, b);
  };
  const { x0, x1, z0, z1 } = BUILDING;

  // Outside: vines down part of the west, east and back walls.
  for (let y = 3; y <= 13; y++) {
    for (const z of [13, 14, 20, 21, 22]) if (noise(x0 - 1, y, z, 31) < 0.8) put(x0 - 1, y, z, vine(VINE_BIT.east));
    for (const z of [16, 17, 23]) if (noise(x1 + 1, y, z, 32) < 0.8) put(x1 + 1, y, z, vine(VINE_BIT.west));
    for (const x of [12, 13, 19, 20]) if (noise(x, y, z1 + 1, 33) < 0.8) put(x, y, z1 + 1, vine(VINE_BIT.north));
  }
  // Inside: vines on the west walls, above head height.
  for (const [y0, y1] of [[4, 6], [11, 13], [18, 21]]) for (let y = y0; y <= y1; y++) for (const z of [22, 23]) put(IX0, y, z, vine(VINE_BIT.west));

  // Cobwebs: corners and under the ceilings of floors 1 and 2.
  for (const [x, y, z] of [
    [11, 6, 24], [12, 6, 24], [11, 5, 24], [11, 1, 24], [11, 2, 24], [21, 6, 12], [14, 5, 18], [19, 5, 17],
    [11, 13, 24], [12, 13, 24], [11, 12, 24], [11, 8, 24], [16, 12, 18], [18, 12, 19], [21, 13, 17],
  ] as Point[]) put(x, y, z, WEB);
  // Floor 3, the storage attic, gets the most: floor corners plus the roof space.
  for (const [x, y, z] of [[23, 15, 21], [23, 16, 21], [12, 16, 24], [23, 15, 13]] as Point[]) put(x, y, z, WEB);
  for (let y = 18; y <= 28; y++)
    for (let x = IX0; x <= IX1; x++)
      for (let z = IZ0; z <= IZ1; z++) {
        const k = y - ROOF_BASE_Y;
        if (k >= 0 && (z <= z0 + k || z >= z1 - k)) continue;
        const nextToWood = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]].some(([dx, dy, dz]) => !isAir(x + dx, y + dy, z + dz));
        if (nextToWood && noise(x, y, z, 34) < 0.22) put(x, y, z, WEB);
      }
}

/** The whole template in the compileTemplate format of scripts/lib/mcstructure.mjs. */
export default function windmillTemplate(): {
  size: Point;
  blocks: Record<string, TemplateBlock>;
  layers: Record<string, string[]>;
} {
  const cells: Cells = new Map();
  const set = (x: number, y: number, z: number, b: TemplateBlock): void => {
    const [sx, sy, sz] = WINDMILL_SIZE;
    if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) throw new Error(`windmill: ${key(x, y, z)} outside the template`);
    cells.set(key(x, y, z), b);
  };

  for (let x = 0; x < PLOT; x++)
    for (let z = 0; z < PLOT; z++) {
      const f = fieldCell(x, z);
      if (f === undefined) continue;
      set(x, 0, z, f.ground);
      if (f.above) set(x, 1, z, f.above);
    }
  building(set);
  stair(set);
  rotor(set);
  for (const [floor, list] of CHESTS.entries())
    for (const c of list) {
      set(...c.at, { name: "minecraft:chest", states: { "minecraft:cardinal_direction": c.facing }, chest: { items: [] } });
      if (c.at[1] !== FLOOR_SLAB_Y[floor] + 1) throw new Error(`windmill: chest ${c.at.join(",")} is not on floor ${floor + 1}`);
    }
  for (const s of SPAWNERS) set(...s.at, { name: "minecraft:mob_spawner", spawner: { entity: s.entity } });
  for (const l of LANTERNS) set(...l.at, { name: "minecraft:lantern", states: { hanging: l.hanging } });
  // Storage decor on floor 3.
  for (const [x, y, z] of [[12, 15, 24], [13, 15, 24], [12, 16, 24]] as Point[]) set(x, y, z, log("minecraft:hay_block", "y"));
  decay(cells, set);

  // Legend: '.' is air, every other distinct block gets the next printable character.
  const blocks: Record<string, TemplateBlock> = { ".": AIR };
  const charOf = new Map<string, string>([[JSON.stringify(AIR), "."]]);
  let next = 33;
  const legendChar = (b: TemplateBlock): string => {
    const id = JSON.stringify(b);
    let ch = charOf.get(id);
    if (ch === undefined) {
      if (next === 46) next++;
      if (next > 126) throw new Error("windmill: more distinct blocks than legend characters");
      ch = String.fromCharCode(next++);
      charOf.set(id, ch);
      blocks[ch] = b;
    }
    return ch;
  };

  const [sx, sy, sz] = WINDMILL_SIZE;
  const layers: Record<string, string[]> = {};
  for (let y = 0; y < sy; y++) {
    const rows: string[] = [];
    for (let z = 0; z < sz; z++) {
      let row = "";
      for (let x = 0; x < sx; x++) row += legendChar(cells.get(key(x, y, z)) ?? AIR);
      rows.push(row);
    }
    layers[String(y)] = rows;
  }
  return { size: WINDMILL_SIZE, blocks, layers };
}

