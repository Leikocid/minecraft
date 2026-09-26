// The Mini Warden City template (§13, L0-wrdn-rul2..rul5): one fixed compact
// build in the Ancient City style, compiled by scripts/build-structures.mjs
// into packs/behavior/structures/andrew/warden-city.mcstructure (engine id
// "andrew:warden-city"). Only rotation varies at placement.
//
// Template-local axes: x west→east, y up, z north→south. Floor at y = 0,
// everyone walks at y = 1. The central hall is the only room taller than the
// wings, so the massing is stepped: the hall block rises to y = 12, the wings
// to y = 6. Cells outside the irregular outline are structure_void, so the
// surrounding terrain stays as generated.
//
// The side is odd (31) so the template centre (15, 15) maps onto itself under
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
export const WARDEN_CITY_SIZE: Point = [31, 13, 31];
export const CENTER_XZ = [15, 15] as const;

/** Hall air; its roof is y = HALL.y1 + 1 .. the template top, three solid layers. */
export const HALL: Box = { x0: 9, x1: 21, y0: 1, y1: 9, z0: 9, z1: 21 };

/** A frame of reinforced deepslate against the hall's north side: 5 wide, 7 tall, one thick. */
export const MONUMENT: Box = { x0: 13, x1: 17, y0: 1, y1: 7, z0: 10, z1: 10 };

/** Stepped massing: each block of the outline and the top of its solid shell. */
const MASSES: readonly { x0: number; x1: number; z0: number; z1: number; top: number }[] = [
  { x0: 7, x1: 23, z0: 7, z1: 23, top: 12 },
  { x0: 0, x1: 7, z0: 3, z1: 25, top: 6 },
  { x0: 6, x1: 22, z0: 0, z1: 7, top: 6 },
  { x0: 23, x1: 30, z0: 8, z1: 22, top: 6 },
  { x0: 9, x1: 24, z0: 23, z1: 30, top: 6 },
];

const WING_Y = { y0: 1, y1: 4 };

/** Rooms and passages carved out of the massing, in carving order. */
const CARVE: readonly Box[] = [
  HALL,
  { x0: 2, x1: 5, ...WING_Y, z0: 5, z1: 23 }, // west gallery
  { x0: 3, x1: 8, y0: 1, y1: 3, z0: 4, z1: 5 }, // west gallery → north gallery
  { x0: 6, x1: 8, ...WING_Y, z0: 14, z1: 16 }, // west door
  { x0: 8, x1: 20, ...WING_Y, z0: 2, z1: 5 }, // north gallery
  { x0: 10, x1: 10, y0: 1, y1: 3, z0: 6, z1: 8 }, // north passages into the hall
  { x0: 20, x1: 20, y0: 1, y1: 3, z0: 6, z1: 8 },
  { x0: 22, x1: 23, ...WING_Y, z0: 14, z1: 16 }, // east door
  { x0: 24, x1: 29, ...WING_Y, z0: 10, z1: 20 }, // east room
  { x0: 14, x1: 16, ...WING_Y, z0: 22, z1: 23 }, // south door
  { x0: 10, x1: 23, ...WING_Y, z0: 24, z1: 28 }, // south hall
];

/** Three in the hall (the central zone), seven spread through the wings. */
export const CHESTS: readonly { at: Point; facing: Facing; zone: "central" | "outer" }[] = [
  { at: [9, 1, 11], facing: "east", zone: "central" },
  { at: [21, 1, 11], facing: "west", zone: "central" },
  { at: [12, 1, 21], facing: "north", zone: "central" },
  { at: [2, 1, 8], facing: "east", zone: "outer" },
  { at: [2, 1, 21], facing: "east", zone: "outer" },
  { at: [12, 1, 2], facing: "south", zone: "outer" },
  { at: [18, 1, 2], facing: "south", zone: "outer" },
  { at: [29, 1, 11], facing: "west", zone: "outer" },
  { at: [11, 1, 28], facing: "north", zone: "outer" },
  { at: [22, 1, 28], facing: "north", zone: "outer" },
];

/** One in front of the monument, one in the far corner of the east room. */
export const SHRIEKERS: readonly { at: Point; slot: "central" | "far" }[] = [
  { at: [15, 1, 12], slot: "central" },
  { at: [28, 1, 19], slot: "far" },
];

/** Floor sensors; none within two blocks of a shrieker, none in a doorway. */
export const SENSORS: readonly Point[] = [
  [11, 1, 14],
  [19, 1, 18],
  [18, 1, 13],
  [10, 1, 19],
  [3, 1, 11],
  [4, 1, 18],
  [15, 1, 3],
  [9, 1, 4],
  [26, 1, 12],
  [25, 1, 18],
  [13, 1, 26],
  [20, 1, 25],
];

/**
 * The only light sources (§13.1: a few soul lamps by passages and the centre).
 * Soul lanterns and soul torches both emit block light 10.
 */
export const LIGHTS: readonly { at: Point; block: TemplateBlock }[] = [
  { at: [12, 1, 10], block: { name: "minecraft:soul_torch", states: { torch_facing_direction: "top" } } },
  { at: [18, 1, 10], block: { name: "minecraft:soul_torch", states: { torch_facing_direction: "top" } } },
  { at: [7, 4, 15], block: { name: "minecraft:soul_lantern", states: { hanging: true } } },
  { at: [23, 4, 15], block: { name: "minecraft:soul_lantern", states: { hanging: true } } },
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
  const cells = new Map<string, TemplateBlock>();
  const get = (x: number, y: number, z: number): TemplateBlock => cells.get(key(x, y, z)) ?? VOID;
  const set = (x: number, y: number, z: number, b: TemplateBlock): void => {
    if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) throw new Error(`warden-city: ${key(x, y, z)} outside the template`);
    cells.set(key(x, y, z), b);
  };
  const carved = (x: number, y: number, z: number): boolean => CARVE.some((b) => inBox(b, x, y, z));

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

  // Hall pillars, clear of the marker column block (x/z 13..17) and the monument.
  for (const [px, pz] of [[10, 13], [10, 17], [20, 13], [20, 17]])
    for (let y = HALL.y0; y <= HALL.y1; y++) set(px, y, pz, y === HALL.y1 ? CHISELED : POLISHED);
  // Wool bands along the hall's long walls, as in the Ancient City's banners.
  for (let z = 12; z <= 18; z += 3) for (const x of [8, 22]) for (let y = 5; y <= 6; y++) set(x, y, z, WOOL);

  for (let x = MONUMENT.x0; x <= MONUMENT.x1; x++)
    for (let y = MONUMENT.y0; y <= MONUMENT.y1; y++) {
      const rim = x === MONUMENT.x0 || x === MONUMENT.x1 || y === MONUMENT.y0 || y === MONUMENT.y1;
      if (rim) set(x, y, MONUMENT.z0, REINFORCED);
    }
  // A tiled plinth behind the frame.
  for (let x = MONUMENT.x0 - 1; x <= MONUMENT.x1 + 1; x++) set(x, 0, MONUMENT.z0, CHISELED);

  // Sculk spread: patches in the floor, veins lying on it.
  for (let x = 0; x < sx; x++)
    for (let z = 0; z < sz; z++) {
      if (!carved(x, 1, z) || get(x, 1, z) !== AIR) continue;
      const floor = get(x, 0, z);
      if (floor === VOID || floor === AIR || floor === CHISELED) continue;
      const n = noise(x, 0, z, 29);
      if (n < 0.4) set(x, 0, z, SCULK);
      else if (n < 0.55) set(x, 1, z, VEIN);
    }

  for (const c of CHESTS) set(...c.at, { name: "minecraft:chest", states: { "minecraft:cardinal_direction": c.facing }, chest: { items: [] } });
  for (const s of SHRIEKERS) {
    set(...s.at, SHRIEKER);
    set(s.at[0], s.at[1] - 1, s.at[2], SCULK);
  }
  for (const s of SENSORS) {
    set(...s, SENSOR);
    set(s[0], s[1] - 1, s[2], SCULK);
  }
  for (const l of LIGHTS) set(...l.at, l.block);
  for (const c of CHESTS) if (get(c.at[0], c.at[1] + 1, c.at[2]) !== AIR) throw new Error(`warden-city: chest ${key(...c.at)} cannot open`);

  // Legend: '.' air, ' ' is not used (compileTemplate reads it as "leave as is"), others in order.
  const blocks: Record<string, TemplateBlock> = { ".": AIR };
  const charOf = new Map<string, string>([[JSON.stringify(AIR), "."]]);
  let next = 33;
  const legendChar = (b: TemplateBlock): string => {
    const id = JSON.stringify(b);
    let ch = charOf.get(id);
    if (ch === undefined) {
      if (next === 46) next++;
      if (next > 126) throw new Error("warden-city: more distinct blocks than legend characters");
      ch = String.fromCharCode(next++);
      charOf.set(id, ch);
      blocks[ch] = b;
    }
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
