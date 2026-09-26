// The Airship template (§5.1–§5.3, L0-airs-r001/r002): one fixed modern,
// undamaged airship, compiled by scripts/build-structures.mjs into
// packs/behavior/structures/andrew/airship.mcstructure (engine id
// "andrew:airship"). Only rotation varies at placement.
//
// Template-local axes: x west→east (the long axis), y up, z north→south.
// Lower hull, the gondola, is y 0..5; the balloon above it is solid decoration.
//
// ASSUMPTION (L0-airs-as01, the spec does not fix the axis): the two doors sit
// on the short ends of the long axis — bow (x = 0) and stern (x = 14) — and the
// corridor runs straight between them. tests/airship-template.test.mjs pins it.
//
// Pure data, no @minecraft/server: the GameTest pack imports the named points
// below, node evaluates the default export at build time.

import type { TemplateBlock } from "./windmill-fields";

export type Point = readonly [number, number, number];

export const AIRSHIP_ID = "andrew:airship";
export const AIRSHIP_SIZE: Point = [15, 12, 7];

/** Gondola floor and ceiling; players stand at y = 1 with headroom up to y = 4. */
export const GONDOLA_FLOOR_Y = 0;
export const GONDOLA_TOP_Y = 5;
const MID_Z = 3;
const DIVIDER_X = 7;

export const DOORS: readonly { lower: Point; upper: Point; facing: "east" | "west" }[] = [
  { lower: [0, 1, MID_Z], upper: [0, 2, MID_Z], facing: "east" },
  { lower: [14, 1, MID_Z], upper: [14, 2, MID_Z], facing: "west" },
];

/** In the corridor floor, so the 1-wide corridor stays walkable door to door. */
export const SPAWNER: { at: Point; entity: string } = { at: [DIVIDER_X, GONDOLA_FLOOR_Y, MID_Z], entity: "minecraft:vindicator" };

type Facing = "north" | "east" | "south" | "west";

/**
 * The four rooms: one-wide rows along the hull, split by the divider at x = 7,
 * each entered by a doorway in the corridor partition. The doorway and the
 * lamp sit at opposite ends of the room so the lamp's light reaches the
 * spawner's reach at no more than 7 (the Windmill's Lmax).
 */
export const ROOMS: readonly { z: number; x0: number; x1: number; doorwayX: number; lamp: Point; chests: readonly { at: Point; facing: Facing }[] }[] = [
  { z: 1, x0: 2, x1: 6, doorwayX: 5, lamp: [2, 4, 1], chests: [{ at: [2, 1, 1], facing: "east" }, { at: [6, 1, 1], facing: "west" }] },
  { z: 1, x0: 8, x1: 12, doorwayX: 9, lamp: [12, 4, 1], chests: [{ at: [8, 1, 1], facing: "east" }, { at: [12, 1, 1], facing: "west" }] },
  { z: 5, x0: 2, x1: 6, doorwayX: 5, lamp: [2, 4, 5], chests: [{ at: [2, 1, 5], facing: "east" }, { at: [6, 1, 5], facing: "west" }] },
  { z: 5, x0: 8, x1: 12, doorwayX: 9, lamp: [12, 4, 5], chests: [{ at: [8, 1, 5], facing: "east" }, { at: [12, 1, 5], facing: "west" }] },
];

/** Two chests in niches of the corridor partitions, facing into the corridor. */
export const CORRIDOR_CHESTS: readonly { at: Point; facing: Facing }[] = [
  { at: [DIVIDER_X, 1, 2], facing: "south" },
  { at: [DIVIDER_X, 1, 4], facing: "north" },
];

export const CHESTS: readonly { at: Point; facing: Facing }[] = [...ROOMS.flatMap((r) => r.chests), ...CORRIDOR_CHESTS];

const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;

const AIR: TemplateBlock = { name: "minecraft:air" };
const GRAY: TemplateBlock = { name: "minecraft:gray_concrete" };
const LIGHT_GRAY: TemplateBlock = { name: "minecraft:light_gray_concrete" };
const GLASS: TemplateBlock = { name: "minecraft:glass" };
const IRON: TemplateBlock = { name: "minecraft:iron_block" };
const CHAIN: TemplateBlock = { name: "minecraft:iron_chain", states: { pillar_axis: "y" } };

/** Gondola plan: the z range of each x column — an oval tapering to the door ends. */
function gondolaZ(x: number): [number, number] {
  if (x === 0 || x === 14) return [2, 4];
  if (x === 1 || x === 13) return [1, 5];
  return [0, 6];
}
const inPlan = (x: number, z: number): boolean => x >= 0 && x <= 14 && z >= gondolaZ(x)[0] && z <= gondolaZ(x)[1];
const onRim = (x: number, z: number): boolean => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inPlan(x + dx, z + dz));

type Put = (x: number, y: number, z: number, b: TemplateBlock) => void;

function gondola(set: Put): void {
  for (let x = 0; x <= 14; x++)
    for (let z = gondolaZ(x)[0]; z <= gondolaZ(x)[1]; z++)
      for (let y = GONDOLA_FLOOR_Y; y <= GONDOLA_TOP_Y; y++) {
        const rim = onRim(x, z);
        // Rounded keel and roof edge along the long sides.
        if ((z === 0 || z === 6) && (y === GONDOLA_FLOOR_Y || y === GONDOLA_TOP_Y)) continue;
        if (y === GONDOLA_FLOOR_Y) set(x, y, z, rim ? GRAY : LIGHT_GRAY);
        else if (y === GONDOLA_TOP_Y || rim) set(x, y, z, GRAY);
        else set(x, y, z, AIR);
      }

  // Corridor partitions and the room divider, full height.
  for (let x = 1; x <= 13; x++) for (let y = 1; y <= 4; y++) for (const z of [2, 4]) set(x, y, z, LIGHT_GRAY);
  for (let y = 1; y <= 4; y++) for (const z of [1, 5]) set(DIVIDER_X, y, z, LIGHT_GRAY);
  for (const r of ROOMS) {
    const pz = r.z < MID_Z ? 2 : 4;
    for (let y = 1; y <= 2; y++) set(r.doorwayX, y, pz, AIR);
  }
  // A corridor chest needs air above it to open.
  for (const c of CORRIDOR_CHESTS) set(c.at[0], c.at[1] + 1, c.at[2], AIR);

  // Intact windows in the rooms' outer walls, away from the lamps.
  for (const r of ROOMS) {
    const wz = r.z < MID_Z ? 0 : 6;
    for (const x of [r.x0 + 1, r.x0 + 2, r.x0 + 3].filter((x) => x !== r.lamp[0])) set(x, 2, wz, GLASS);
  }

  for (const d of DOORS) {
    set(...d.lower, { name: "minecraft:wooden_door", states: { upper_block_bit: false, "minecraft:cardinal_direction": d.facing, open_bit: false, door_hinge_bit: false } });
    set(...d.upper, { name: "minecraft:wooden_door", states: { upper_block_bit: true, "minecraft:cardinal_direction": d.facing, open_bit: false, door_hinge_bit: false } });
    set(d.lower[0], 3, MID_Z, IRON);
  }
}

/** The balloon: a solid ellipsoid, so there is no room inside it for anything. */
function balloon(set: Put): void {
  const [cx, cy, cz] = [7, 8.5, 3];
  const [rx, ry, rz] = [7.5, 3, 3.5];
  for (let x = 0; x <= 14; x++)
    for (let y = GONDOLA_TOP_Y + 1; y < AIRSHIP_SIZE[1]; y++)
      for (let z = 0; z <= 6; z++) {
        const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2;
        if (d <= 1) set(x, y, z, y === 9 ? GRAY : LIGHT_GRAY);
      }
  // Chains from the gondola roof up to the balloon's underside.
  for (const [x, z] of [[3, 1], [11, 1], [3, 5], [11, 5]]) set(x, GONDOLA_TOP_Y + 1, z, CHAIN);
}

/** The whole template in the compileTemplate format of scripts/lib/mcstructure.mjs. */
export default function airshipTemplate(): {
  size: Point;
  blocks: Record<string, TemplateBlock>;
  layers: Record<string, string[]>;
} {
  const cells = new Map<string, TemplateBlock>();
  const set: Put = (x, y, z, b) => {
    const [sx, sy, sz] = AIRSHIP_SIZE;
    if (x < 0 || y < 0 || z < 0 || x >= sx || y >= sy || z >= sz) throw new Error(`airship: ${key(x, y, z)} outside the template`);
    cells.set(key(x, y, z), b);
  };

  gondola(set);
  balloon(set);
  for (const c of CHESTS) set(...c.at, { name: "minecraft:chest", states: { "minecraft:cardinal_direction": c.facing }, chest: { items: [] } });
  set(...SPAWNER.at, { name: "minecraft:mob_spawner", spawner: { entity: SPAWNER.entity } });
  for (const r of ROOMS) set(...r.lamp, { name: "minecraft:lantern", states: { hanging: true } });

  // Legend: '.' is air, every other distinct block gets the next printable character.
  const blocks: Record<string, TemplateBlock> = { ".": AIR };
  const charOf = new Map<string, string>([[JSON.stringify(AIR), "."]]);
  let next = 33;
  const legendChar = (b: TemplateBlock): string => {
    const id = JSON.stringify(b);
    let ch = charOf.get(id);
    if (ch === undefined) {
      if (next === 46) next++;
      if (next > 126) throw new Error("airship: more distinct blocks than legend characters");
      ch = String.fromCharCode(next++);
      charOf.set(id, ch);
      blocks[ch] = b;
    }
    return ch;
  };

  const [sx, sy, sz] = AIRSHIP_SIZE;
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
  return { size: AIRSHIP_SIZE, blocks, layers };
}
