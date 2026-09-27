// The Mini Warden City template (§13, L0-wrdn-rul2..rul5): one fixed build in
// the Ancient City style, compiled by scripts/build-structures.mjs into
// packs/behavior/structures/andrew/warden-city.mcstructure (engine id
// "andrew:warden-city"). Only rotation varies at placement.
//
// Template-local axes: x west→east, y up, z north→south. Floor at y = 0,
// everyone walks at y = 1 except in the hall's upper level (y = 9, on the
// gallery and the bridge) and on the monument dais (y = 3). The massing is stepped: the central hall block rises
// to y = 19, the wings around it to y = 8, the two corner ruins to y = 6.
// Cells outside the irregular outline are structure_void, so the surrounding
// terrain stays as generated.
//
// Plan: the hall in the middle, a ring avenue around it with a door on each
// side, three rooms off every side of the ring and two ruined corner rooms.
// The size is four times the §13 footprint by area (decision of 2026-09-27),
// and the chest and shrieker counts grow with it: 40 chests, 12 of them in the
// hall, 8 shriekers kept mostly in the far rooms.
//
// The side is odd (63) so the template centre (31, 31) maps onto itself under
// every rotation: the surface marker sits over that column, and the column
// runs through the hall roof into the open hall, clear of the monument.
//
// Pure data, no @minecraft/server: the GameTest pack imports the named points
// below, node evaluates the default export at build time.

import type { Rotation, Vec3 } from "../registry";
import { rotateLocal } from "../rotate";
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

export const WARDEN_CITY_ID = "andrew:warden-city";
export const WARDEN_CITY_SIZE: Point = [63, 20, 63];
export const CENTER_XZ = [31, 31] as const;

/** Hall air; its roof is y = HALL.y1 + 1 .. the template top, five solid layers. */
export const HALL: Box = { x0: 20, x1: 42, y0: 1, y1: 14, z0: 20, z1: 42 };

/** A frame of reinforced deepslate on the monument dais: 5 wide, 7 tall, one thick. */
export const MONUMENT: Box = { x0: 29, x1: 33, y0: 3, y1: 9, z0: 25, z1: 25 };

/** The raised floor the monument stands on, against the hall's north wall; its top is y = 2. */
const DAIS: Box = { x0: 24, x1: 38, y0: 1, y1: 2, z0: 20, z1: 28 };

/** Stepped massing: each block of the outline and the top of its solid shell. */
const MASSES: readonly { x0: number; x1: number; z0: number; z1: number; top: number }[] = [
  { x0: 17, x1: 45, z0: 17, z1: 45, top: 19 },
  { x0: 10, x1: 52, z0: 0, z1: 17, top: 8 },
  { x0: 10, x1: 52, z0: 45, z1: 62, top: 8 },
  { x0: 0, x1: 17, z0: 10, z1: 52, top: 8 },
  { x0: 45, x1: 62, z0: 10, z1: 52, top: 8 },
  { x0: 1, x1: 9, z0: 1, z1: 9, top: 6 },
  { x0: 53, x1: 61, z0: 53, z1: 61, top: 6 },
];

const AVENUE_Y = { y0: 1, y1: 4 };
const ROOM_Y = { y0: 1, y1: 5 };
const DOOR_Y = { y0: 1, y1: 3 };

/** The ring avenue around the hall, 4 wide. */
const RING: readonly Box[] = [
  { x0: 11, x1: 51, ...AVENUE_Y, z0: 11, z1: 14 },
  { x0: 11, x1: 51, ...AVENUE_Y, z0: 48, z1: 51 },
  { x0: 11, x1: 14, ...AVENUE_Y, z0: 11, z1: 51 },
  { x0: 48, x1: 51, ...AVENUE_Y, z0: 11, z1: 51 },
];

/** The twelve rooms off the ring, north, south, west and east, in that order. */
export const ROOMS: readonly Box[] = [
  { x0: 12, x1: 20, ...ROOM_Y, z0: 2, z1: 8 },
  { x0: 26, x1: 36, ...ROOM_Y, z0: 2, z1: 8 },
  { x0: 42, x1: 50, ...ROOM_Y, z0: 2, z1: 8 },
  { x0: 12, x1: 22, ...ROOM_Y, z0: 54, z1: 60 },
  { x0: 27, x1: 35, ...ROOM_Y, z0: 54, z1: 60 },
  { x0: 40, x1: 50, ...ROOM_Y, z0: 54, z1: 60 },
  { x0: 2, x1: 8, ...ROOM_Y, z0: 12, z1: 20 },
  { x0: 2, x1: 8, ...ROOM_Y, z0: 26, z1: 36 },
  { x0: 2, x1: 8, ...ROOM_Y, z0: 42, z1: 50 },
  { x0: 54, x1: 60, ...ROOM_Y, z0: 12, z1: 22 },
  { x0: 54, x1: 60, ...ROOM_Y, z0: 28, z1: 34 },
  { x0: 54, x1: 60, ...ROOM_Y, z0: 40, z1: 50 },
];

/** The two ruined corner rooms, north-west and south-east; the other two corners stay open ground. */
const RUINS: readonly Box[] = [
  { x0: 3, x1: 7, ...AVENUE_Y, z0: 3, z1: 7 },
  { x0: 55, x1: 59, ...AVENUE_Y, z0: 55, z1: 59 },
];

const DOORS: readonly Box[] = [
  // Hall doors, one in the middle of each wall.
  { x0: 30, x1: 32, ...AVENUE_Y, z0: 15, z1: 19 },
  { x0: 30, x1: 32, ...AVENUE_Y, z0: 43, z1: 47 },
  { x0: 15, x1: 19, ...AVENUE_Y, z0: 30, z1: 32 },
  { x0: 43, x1: 47, ...AVENUE_Y, z0: 30, z1: 32 },
  // Room doors off the ring.
  { x0: 15, x1: 17, ...DOOR_Y, z0: 9, z1: 10 },
  { x0: 30, x1: 32, ...DOOR_Y, z0: 9, z1: 10 },
  { x0: 45, x1: 47, ...DOOR_Y, z0: 9, z1: 10 },
  { x0: 16, x1: 18, ...DOOR_Y, z0: 52, z1: 53 },
  { x0: 30, x1: 32, ...DOOR_Y, z0: 52, z1: 53 },
  { x0: 44, x1: 46, ...DOOR_Y, z0: 52, z1: 53 },
  { x0: 9, x1: 10, ...DOOR_Y, z0: 15, z1: 17 },
  { x0: 9, x1: 10, ...DOOR_Y, z0: 30, z1: 32 },
  { x0: 9, x1: 10, ...DOOR_Y, z0: 45, z1: 47 },
  { x0: 52, x1: 53, ...DOOR_Y, z0: 16, z1: 18 },
  { x0: 52, x1: 53, ...DOOR_Y, z0: 30, z1: 32 },
  { x0: 52, x1: 53, ...DOOR_Y, z0: 44, z1: 46 },
  // Crawl-throughs from the corner rooms of the north and south rows into the ruins.
  { x0: 8, x1: 11, ...DOOR_Y, z0: 4, z1: 6 },
  { x0: 51, x1: 54, ...DOOR_Y, z0: 56, z1: 58 },
];

/** Rooms and passages carved out of the massing. */
const CARVE: readonly Box[] = [HALL, ...RING, ...ROOMS, ...RUINS, ...DOORS];

/** The floor of the hall's upper level; it is walked one block higher. */
export const UPPER_FLOOR_Y = 8;

/**
 * The upper level: a gallery along the west, south and east walls and a bridge
 * across the front of the monument, closing it into a ring around the open
 * middle of the hall. The middle stays open floor to roof over the centre column.
 */
const GALLERY: readonly Box[] = [
  { x0: 20, x1: 24, y0: UPPER_FLOOR_Y, y1: UPPER_FLOOR_Y, z0: 20, z1: 42 },
  { x0: 38, x1: 42, y0: UPPER_FLOOR_Y, y1: UPPER_FLOOR_Y, z0: 20, z1: 42 },
  { x0: 25, x1: 37, y0: UPPER_FLOOR_Y, y1: UPPER_FLOOR_Y, z0: 37, z1: 42 },
  { x0: 25, x1: 37, y0: UPPER_FLOOR_Y, y1: UPPER_FLOOR_Y, z0: 28, z1: 29 },
];

type Chest = { at: Point; facing: Facing; zone: "central" | "outer" };
const hall = (x: number, y: number, z: number, facing: Facing): Chest => ({ at: [x, y, z], facing, zone: "central" });
const outer = (x: number, z: number, facing: Facing): Chest => ({ at: [x, 1, z], facing, zone: "outer" });

/** Twelve in the hall (the central zone), ten of them upstairs; twenty-eight spread through the rooms and ruins. */
export const CHESTS: readonly Chest[] = [
  // Hall: two on the dais by the towers, ten along the gallery walls.
  hall(27, 3, 28, "south"),
  hall(35, 3, 28, "south"),
  hall(20, 9, 22, "east"),
  hall(20, 9, 27, "east"),
  hall(20, 9, 33, "east"),
  hall(20, 9, 39, "east"),
  hall(42, 9, 23, "west"),
  hall(42, 9, 28, "west"),
  hall(42, 9, 34, "west"),
  hall(42, 9, 40, "west"),
  hall(28, 9, 42, "north"),
  hall(34, 9, 42, "north"),
  // North rooms.
  outer(19, 2, "south"),
  outer(13, 8, "north"),
  outer(27, 2, "south"),
  outer(35, 2, "south"),
  outer(43, 2, "south"),
  outer(50, 7, "west"),
  // South rooms.
  outer(21, 60, "north"),
  outer(12, 55, "east"),
  outer(28, 60, "north"),
  outer(34, 60, "north"),
  outer(41, 60, "north"),
  outer(49, 60, "north"),
  // West rooms.
  outer(2, 13, "east"),
  outer(7, 20, "north"),
  outer(2, 27, "east"),
  outer(8, 36, "west"),
  outer(2, 49, "east"),
  outer(8, 42, "west"),
  // East rooms.
  outer(60, 13, "west"),
  outer(55, 22, "north"),
  outer(60, 34, "west"),
  outer(55, 28, "south"),
  outer(60, 41, "west"),
  outer(56, 50, "north"),
  // Ruins.
  outer(7, 3, "south"),
  outer(3, 7, "east"),
  outer(55, 59, "north"),
  outer(59, 55, "west"),
];

/**
 * Two in the hall's upper level — one on the bridge before the monument, one
 * in the far corner of the gallery — and six in the far rooms and ruins, apart
 * from each other.
 */
export const SHRIEKERS: readonly { at: Point; slot: "central" | "far" }[] = [
  { at: [31, 9, 28], slot: "central" },
  { at: [42, 9, 41], slot: "central" },
  { at: [6, 1, 6], slot: "far" },
  { at: [56, 1, 56], slot: "far" },
  { at: [49, 1, 3], slot: "far" },
  { at: [13, 1, 59], slot: "far" },
  { at: [3, 1, 35], slot: "far" },
  { at: [59, 1, 29], slot: "far" },
];

/** Sensors on the floor; none within two blocks of a shrieker, none in a doorway. */
export const SENSORS: readonly Point[] = [
  // Hall floor and gallery.
  [28, 1, 33],
  [35, 1, 40],
  [29, 1, 39],
  [33, 1, 34],
  [23, 1, 36],
  [22, 9, 30],
  [40, 9, 25],
  [31, 9, 40],
  // Ring avenue.
  [20, 1, 12],
  [42, 1, 13],
  [12, 1, 24],
  [13, 1, 40],
  [50, 1, 22],
  [49, 1, 42],
  [22, 1, 50],
  [40, 1, 49],
  // Rooms.
  [17, 1, 5],
  [31, 1, 4],
  [34, 1, 7],
  [45, 1, 6],
  [17, 1, 57],
  [31, 1, 57],
  [28, 1, 55],
  [45, 1, 57],
  [5, 1, 16],
  [5, 1, 29],
  [6, 1, 34],
  [5, 1, 46],
  [57, 1, 17],
  [57, 1, 32],
  [56, 1, 30],
  [57, 1, 45],
];

const TORCH: TemplateBlock = { name: "minecraft:soul_torch", states: { torch_facing_direction: "top" } };
const LANTERN: TemplateBlock = { name: "minecraft:soul_lantern", states: { hanging: true } };

/**
 * The only light sources (§13.1: a few soul lamps by passages and the centre):
 * two torches flanking the monument frame, a lantern hung in the ring avenue
 * beside each hall door and two more at opposite corners of the ring.
 * Soul lanterns and soul torches both emit block light 10.
 */
export const LIGHTS: readonly { at: Point; block: TemplateBlock }[] = [
  { at: [29, 3, 27], block: TORCH },
  { at: [33, 3, 27], block: TORCH },
  { at: [27, 4, 13], block: LANTERN },
  { at: [35, 4, 49], block: LANTERN },
  { at: [13, 4, 27], block: LANTERN },
  { at: [49, 4, 35], block: LANTERN },
  { at: [12, 4, 48], block: LANTERN },
  { at: [48, 4, 12], block: LANTERN },
];

/**
 * The surface marker (§13.3): an irregular sculk / vein patch within 5×5,
 * as offsets from the template centre column. Deliberately asymmetric, so a
 * rotation shows up in its shape. It is one layer on the surface and nothing
 * else: no cell of it is ever air, a ladder or a hole.
 */
export const MARKER: readonly { dx: number; dz: number; kind: "sculk" | "vein" }[] = (() => {
  const rows = [
    // dz = -2 .. 2, dx = -2 .. 2; S sculk, v vein, . nothing
    ".vSv.",
    "vSSS.",
    "SSSSv",
    ".SSvv",
    "..v..",
  ];
  const out: { dx: number; dz: number; kind: "sculk" | "vein" }[] = [];
  rows.forEach((row, i) =>
    [...row].forEach((ch, j) => {
      if (ch !== ".") out.push({ dx: j - 2, dz: i - 2, kind: ch === "S" ? "sculk" : "vein" });
    })
  );
  return out;
})();

/**
 * World x/z of every marker cell for a city placed at `origin` (min corner)
 * with rotation `rot`; the patch rotates with the city about its centre.
 */
export function markerColumns(origin: Vec3, rot: Rotation): { x: number; z: number; kind: "sculk" | "vein"; center: boolean }[] {
  const size: Vec3 = [...WARDEN_CITY_SIZE];
  return MARKER.map((m) => {
    const o = rotateLocal([CENTER_XZ[0] + m.dx, 0, CENTER_XZ[1] + m.dz], size, rot);
    return { x: origin[0] + o[0], z: origin[2] + o[2], kind: m.kind, center: m.dx === 0 && m.dz === 0 };
  });
}

const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;

const AIR: TemplateBlock = { name: "minecraft:air" };
const VOID: TemplateBlock = { name: "minecraft:structure_void" };
const ROCK: TemplateBlock = { name: "minecraft:deepslate", states: { pillar_axis: "y" } };
const BRICKS: TemplateBlock = { name: "minecraft:deepslate_bricks" };
const CRACKED_BRICKS: TemplateBlock = { name: "minecraft:cracked_deepslate_bricks" };
const TILES: TemplateBlock = { name: "minecraft:deepslate_tiles" };
const CRACKED_TILES: TemplateBlock = { name: "minecraft:cracked_deepslate_tiles" };
const POLISHED: TemplateBlock = { name: "minecraft:polished_deepslate" };
const CHISELED: TemplateBlock = { name: "minecraft:chiseled_deepslate" };
const COBBLED: TemplateBlock = { name: "minecraft:cobbled_deepslate" };
const WOOL: TemplateBlock = { name: "minecraft:gray_wool" };
const REINFORCED: TemplateBlock = { name: "minecraft:reinforced_deepslate" };
const SCULK: TemplateBlock = { name: "minecraft:sculk" };
const VEIN: TemplateBlock = { name: "minecraft:sculk_vein", states: { multi_face_direction_bits: 1 } };
const SENSOR: TemplateBlock = { name: "minecraft:sculk_sensor", states: { sculk_sensor_phase: 0 } };
const SHRIEKER: TemplateBlock = { name: "minecraft:sculk_shrieker", states: { active: false, can_summon: true } };

/** Blocks sculk may spread over: the dressed floors, not the monument, the plinths or the rubble. */
const SPREADS_ON = new Set<TemplateBlock>([ROCK, BRICKS, CRACKED_BRICKS, TILES, CRACKED_TILES, POLISHED]);

const inBox = (b: Box, x: number, y: number, z: number): boolean =>
  x >= b.x0 && x <= b.x1 && y >= b.y0 && y <= b.y1 && z >= b.z0 && z <= b.z1;
const massTop = (x: number, z: number): number =>
  Math.max(-1, ...MASSES.filter((m) => x >= m.x0 && x <= m.x1 && z >= m.z0 && z <= m.z1).map((m) => m.top));

/** The whole template in the compileTemplate format of scripts/lib/mcstructure.mjs. */
export default function wardenCityTemplate(): {
  size: Point;
  blocks: Record<string, TemplateBlock>;
  layers: Record<string, string[]>;
} {
  const [sx, sy, sz] = WARDEN_CITY_SIZE;
  const index = (x: number, y: number, z: number): number => (y * sz + z) * sx + x;
  const inside = (x: number, y: number, z: number): boolean => x >= 0 && y >= 0 && z >= 0 && x < sx && y < sy && z < sz;
  // Flat arrays, not keyed maps: the GameTest pack builds this template in the engine's script runtime.
  const cells: TemplateBlock[] = new Array<TemplateBlock>(sx * sy * sz).fill(VOID);
  const carvedAt = new Uint8Array(sx * sy * sz);
  for (const b of CARVE)
    for (let x = b.x0; x <= b.x1; x++) for (let y = b.y0; y <= b.y1; y++) for (let z = b.z0; z <= b.z1; z++) carvedAt[index(x, y, z)] = 1;
  const get = (x: number, y: number, z: number): TemplateBlock => (inside(x, y, z) ? cells[index(x, y, z)] : VOID);
  const set = (x: number, y: number, z: number, b: TemplateBlock): void => {
    if (!inside(x, y, z)) throw new Error(`warden-city: ${key(x, y, z)} outside the template`);
    cells[index(x, y, z)] = b;
  };
  /** A furnishing may only go into open air; anything else is a layout clash. */
  const place = (x: number, y: number, z: number, b: TemplateBlock, what: string): void => {
    const was = get(x, y, z);
    if (was !== AIR && was !== VEIN) throw new Error(`warden-city: ${what} at ${key(x, y, z)} lands on ${was.name}`);
    set(x, y, z, b);
  };
  const fill = (b: Box, block: TemplateBlock | ((x: number, y: number, z: number) => TemplateBlock)): void => {
    for (let x = b.x0; x <= b.x1; x++)
      for (let y = b.y0; y <= b.y1; y++) for (let z = b.z0; z <= b.z1; z++) set(x, y, z, typeof block === "function" ? block(x, y, z) : block);
  };
  const carved = (x: number, y: number, z: number): boolean => inside(x, y, z) && carvedAt[index(x, y, z)] === 1;

  const reserved = new Set([...CHESTS.map((c) => c.at), ...SHRIEKERS.map((c) => c.at), ...SENSORS, ...LIGHTS.map((l) => l.at)].map((p) => key(...p)));

  // Solid massing, then the rooms.
  for (let x = 0; x < sx; x++) for (let z = 0; z < sz; z++) for (let y = 0; y <= massTop(x, z); y++) set(x, y, z, ROCK);
  for (let x = 0; x < sx; x++)
    for (let y = 0; y < sy; y++)
      for (let z = 0; z < sz; z++) {
        if (get(x, y, z) === VOID) continue;
        if (carved(x, y, z)) {
          set(x, y, z, AIR);
          continue;
        }
        // Dressed faces: every solid cell touching a room becomes masonry.
        const face = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([dx, dy, dz]) => carved(x + dx, y + dy, z + dz));
        if (!face) continue;
        const n = noise(x, y, z, 13);
        if (carved(x, y + 1, z)) set(x, y, z, n < 0.15 ? CRACKED_TILES : TILES);
        else if (carved(x, y - 1, z)) set(x, y, z, n < 0.3 ? POLISHED : BRICKS);
        else set(x, y, z, n < 0.18 ? CRACKED_BRICKS : n < 0.24 ? COBBLED : BRICKS);
      }

  // ---- The hall.
  // The upper level on a colonnade; four of its columns run on to the roof.
  const U = UPPER_FLOOR_Y;
  for (const b of GALLERY) fill(b, (x, _y, z) => (noise(x, U, z, 41) < 0.2 ? CRACKED_TILES : TILES));
  for (const [px, pz] of [[24, 21], [24, 25], [24, 33], [38, 21], [38, 25], [38, 33], [28, 37], [34, 37]])
    for (let y = 1; y < U; y++) set(px, y, pz, y === U - 1 ? CHISELED : POLISHED);
  for (const [px, pz] of [[24, 29], [38, 29], [24, 37], [38, 37]]) for (let y = HALL.y0; y <= HALL.y1; y++) set(px, y, pz, y === U - 1 || y === HALL.y1 ? CHISELED : POLISHED);
  // Block steps up from the hall floor: seven, along the inner edge of each side of the gallery, onto its south arm.
  for (const x0 of [25, 36]) for (let i = 1; i <= U - 1; i++) for (let x = x0; x <= x0 + 1; x++) fill({ x0: x, x1: x, y0: 1, y1: i, z0: 29 + i, z1: 29 + i }, (_x, y) => (y === i ? TILES : POLISHED));
  // A crenellated parapet on the open edges, broken where the steps and the bridge come in.
  for (let z = 20; z <= 36; z += 2) for (const x of [24, 38]) if (get(x, U + 1, z) === AIR && (z < 27 || z > 30)) set(x, U + 1, z, BRICKS);
  for (let x = 27; x <= 35; x += 2) if (get(x, U + 1, 37) === AIR) set(x, U + 1, 37, BRICKS);
  for (const x of [26, 28, 34, 36]) set(x, U + 1, 29, BRICKS);
  // A beam across the hall under the roof, broken over the centre column.
  for (let x = 20; x <= 42; x++) if (x < 29 || x > 33) set(x, 14, 31, POLISHED);
  // Wool banners on the hall walls, as in the Ancient City.
  for (let i = 22; i <= 40; i += 6)
    for (let y = 9; y <= 12; y++) {
      set(19, y, i, WOOL);
      set(43, y, i, WOOL);
      set(i, y, 43, WOOL);
    }

  // The monument: a dais, two towers, a back wall and a lintel framing the reinforced frame.
  fill(DAIS, (x, y, z) => (y === 2 ? (noise(x, y, z, 7) < 0.2 ? CRACKED_TILES : TILES) : POLISHED));
  fill({ x0: 27, x1: 35, y0: 1, y1: 1, z0: 29, z1: 29 }, TILES);
  for (const [x0, x1] of [[25, 28], [34, 37]])
    fill({ x0, x1, y0: 3, y1: HALL.y1, z0: 22, z1: 27 }, (x, y, z) => {
      if (y === 7 || y === 12) return CHISELED;
      if ((x === x0 || x === x1) && (z === 22 || z === 27)) return POLISHED;
      if (z === 27 && y >= 8 && y <= 11 && x !== x0 && x !== x1) return WOOL;
      return noise(x, y, z, 17) < 0.15 ? CRACKED_BRICKS : BRICKS;
    });
  fill({ x0: 29, x1: 33, y0: 3, y1: 11, z0: 21, z1: 24 }, (x, y, z) => (noise(x, y, z, 19) < 0.15 ? CRACKED_BRICKS : BRICKS));
  fill({ x0: 25, x1: 37, y0: 10, y1: 12, z0: 23, z1: 26 }, (x, y, z) => (y === 12 ? CHISELED : noise(x, y, z, 23) < 0.12 ? CRACKED_BRICKS : BRICKS));
  fill({ x0: 29, x1: 33, y0: 13, y1: HALL.y1, z0: 23, z1: 26 }, (x, y, z) => (z === 26 && y === 13 && x >= 30 && x <= 32 ? CHISELED : POLISHED));
  for (const x of [24, 38]) fill({ x0: x, x1: x, y0: 3, y1: 5, z0: 21, z1: 26 }, BRICKS);
  for (let x = MONUMENT.x0; x <= MONUMENT.x1; x++)
    for (let y = MONUMENT.y0; y <= MONUMENT.y1; y++) {
      const rim = x === MONUMENT.x0 || x === MONUMENT.x1 || y === MONUMENT.y0 || y === MONUMENT.y1;
      set(x, y, MONUMENT.z0, rim ? REINFORCED : AIR);
    }

  // ---- The ring and the rooms.
  // Ribs across the ring avenue every six blocks.
  for (let t = 14; t <= 50; t += 6)
    for (let w = 11; w <= 14; w++) {
      set(t, 4, w, POLISHED);
      set(t, 4, 62 - w, POLISHED);
      set(w, 4, t, POLISHED);
      set(62 - w, 4, t, POLISHED);
    }
  // Every room: a pair of pillars, a heap of rubble, a wool hanging on its far wall.
  for (const r of ROOMS) {
    const wide = r.x1 - r.x0 >= r.z1 - r.z0;
    const pillars = wide
      ? [[r.x0 + 2, Math.floor((r.z0 + r.z1) / 2)], [r.x1 - 2, Math.floor((r.z0 + r.z1) / 2)]]
      : [[Math.floor((r.x0 + r.x1) / 2), r.z0 + 2], [Math.floor((r.x0 + r.x1) / 2), r.z1 - 2]];
    for (const [px, pz] of pillars) for (let y = r.y0; y <= r.y1; y++) place(px, y, pz, y === r.y1 ? CHISELED : POLISHED, "room pillar");
    // The first inset corner whose 3×3 holds no chest, sculk block or lamp.
    const corners = [[r.x0 + 1, r.z1 - 1], [r.x1 - 1, r.z0 + 1], [r.x0 + 1, r.z0 + 1], [r.x1 - 1, r.z1 - 1]];
    const free = corners.find(([cx, cz]) => [-1, 0, 1].every((dx) => [-1, 0, 1].every((dz) => !reserved.has(key(cx + dx, 1, cz + dz)))));
    if (free === undefined) throw new Error(`warden-city: no corner for rubble in room ${r.x0},${r.z0}`);
    const [hx, hz] = free;
    place(hx, 1, hz, COBBLED, "rubble");
    for (const [dx, dz] of [[1, 0], [0, 1], [-1, 0], [0, -1]])
      if (get(hx + dx, 1, hz + dz) === AIR && !reserved.has(key(hx + dx, 1, hz + dz)) && noise(hx + dx, 1, hz + dz, 31) < 0.6) set(hx + dx, 1, hz + dz, noise(hx, 1, hz, 37) < 0.5 ? CRACKED_BRICKS : COBBLED);
  }
  for (const r of ROOMS) {
    // The wall farthest from the hall.
    const mx = Math.floor((r.x0 + r.x1) / 2);
    const mz = Math.floor((r.z0 + r.z1) / 2);
    const [wx, wz, along] = r.z1 < 17 ? [mx, r.z0 - 1, "x"] : r.z0 > 45 ? [mx, r.z1 + 1, "x"] : r.x1 < 17 ? [r.x0 - 1, mz, "z"] : [r.x1 + 1, mz, "z"];
    for (let d = -1; d <= 1; d++) for (let y = 2; y <= 4; y++) set(along === "x" ? wx + d : wx, y, along === "z" ? wz + d : wz, WOOL);
  }
  // The ruins: a caved-in corner of rubble.
  for (const r of RUINS) {
    const [cx, cz] = r.x0 < 31 ? [r.x0, r.z0] : [r.x1, r.z1];
    const sxn = r.x0 < 31 ? 1 : -1;
    for (const [dx, dz, h] of [[0, 0, 3], [1, 0, 2], [0, 1, 2], [2, 0, 1], [1, 1, 1], [0, 2, 1]])
      for (let y = 1; y <= h; y++) place(cx + dx * sxn, y, cz + dz * sxn, noise(dx, y, dz, 43) < 0.5 ? COBBLED : CRACKED_BRICKS, "ruin rubble");
  }

  // ---- Sculk spread: patches in the floor, veins lying on it, wherever a floor meets open air.
  for (let x = 0; x < sx; x++)
    for (let z = 0; z < sz; z++)
      for (let y = 1; y < sy; y++) {
        if (get(x, y, z) !== AIR || !SPREADS_ON.has(get(x, y - 1, z))) continue;
        const n = noise(x, y - 1, z, 29);
        if (n < 0.4) set(x, y - 1, z, SCULK);
        else if (n < 0.55) set(x, y, z, VEIN);
      }

  for (const c of CHESTS) place(...c.at, { name: "minecraft:chest", states: { "minecraft:cardinal_direction": c.facing }, chest: { items: [] } }, "chest");
  for (const s of SHRIEKERS) {
    place(...s.at, SHRIEKER, "shrieker");
    set(s.at[0], s.at[1] - 1, s.at[2], SCULK);
  }
  for (const s of SENSORS) {
    place(...s, SENSOR, "sensor");
    set(s[0], s[1] - 1, s[2], SCULK);
  }
  for (const l of LIGHTS) place(...l.at, l.block, "light");
  for (const c of CHESTS) if (get(c.at[0], c.at[1] + 1, c.at[2]) !== AIR) throw new Error(`warden-city: chest ${key(...c.at)} cannot open`);

  // Legend: '.' air, ' ' is not used (compileTemplate reads it as "leave as is"), others in order.
  const blocks: Record<string, TemplateBlock> = { ".": AIR };
  const charOf = new Map<TemplateBlock, string>([[AIR, "."]]);
  const charOfId = new Map<string, string>([[JSON.stringify(AIR), "."]]);
  let next = 33;
  const legendChar = (b: TemplateBlock): string => {
    let ch = charOf.get(b);
    if (ch !== undefined) return ch;
    const id = JSON.stringify(b);
    ch = charOfId.get(id);
    if (ch === undefined) {
      if (next === 46) next++;
      if (next > 126) throw new Error("warden-city: more distinct blocks than legend characters");
      ch = String.fromCharCode(next++);
      charOfId.set(id, ch);
      blocks[ch] = b;
    }
    charOf.set(b, ch);
    return ch;
  };

  const layers: Record<string, string[]> = {};
  for (let y = 0; y < sy; y++) {
    const rows: string[] = [];
    for (let z = 0; z < sz; z++) {
      let row = "";
      for (let x = 0; x < sx; x++) row += legendChar(get(x, y, z));
      rows.push(row);
    }
    layers[String(y)] = rows;
  }
  return { size: WARDEN_CITY_SIZE, blocks, layers };
}
