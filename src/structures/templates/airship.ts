// The Airship template (§5.1–§5.3, L0-airs-r001/r002): one fixed modern,
// undamaged airship, compiled by scripts/build-structures.mjs into
// packs/behavior/structures/andrew/airship.mcstructure (engine id
// "andrew:airship"). Only rotation varies at placement.
//
// Template-local axes: x west→east (the long axis, bow at x = 1), y up, z
// north→south. A round envelope 27 long and 7 across (x 1..27, y 4..10) with
// four tail fins sits straight on a small gondola (x 4..16, y 0..3). The
// length is a deliberate departure from the ≈15 of §5.1: at 15 the silhouette
// cannot hold the gondola's contents and still read as an airship.
//
// Pure data, no @minecraft/server: the GameTest pack imports the named points
// below, node evaluates the default export at build time.

import type { TemplateBlock } from "./windmill-fields";

export type Point = readonly [number, number, number];

export const AIRSHIP_ID = "andrew:airship";
export const AIRSHIP_SIZE: Point = [28, 11, 7];

/** Envelope axis: every station is a round section centred here. */
export const AXIS_Y = 7;
export const AXIS_Z = 3;

/** Envelope diameter per station x; x = 0 is empty, the template is one block longer than the envelope. */
export const ENVELOPE_DIAMETER: readonly number[] = [
  0, 1, 3, 5, 5, 5, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 5, 5, 5, 5, 5, 5, 3, 3, 3, 3, 1, 1,
];

/** Half-width of a round section of diameter d at |dy| rows off the axis. */
const HALF: Readonly<Record<number, readonly number[]>> = { 1: [0], 3: [1, 0], 5: [2, 2, 1], 7: [3, 3, 2, 1] };

export const GONDOLA = { x0: 4, x1: 16, z0: 1, z1: 5, floorY: 0, roofY: 3 } as const;
const MID_X = 10;

/** Fins: x 21..26, the vertical pair in the plane z = AXIS_Z, the horizontal pair in y = AXIS_Y. */
export const FINS = { x0: 21, x1: 26, y0: 4, y1: 10, z0: 0, z1: 6 } as const;

/** Doors on the bow and stern ends of the corridor, facing each other along it. */
export const DOORS: readonly { lower: Point; upper: Point; facing: "east" | "west" }[] = [
  { lower: [GONDOLA.x0, 1, AXIS_Z], upper: [GONDOLA.x0, 2, AXIS_Z], facing: "east" },
  { lower: [GONDOLA.x1, 1, AXIS_Z], upper: [GONDOLA.x1, 2, AXIS_Z], facing: "west" },
];

/** In the corridor floor, so the corridor stays walkable door to door. */
export const SPAWNER: { at: Point; entity: string } = { at: [MID_X, GONDOLA.floorY, AXIS_Z], entity: "minecraft:vindicator" };

type Facing = "north" | "east" | "south" | "west";

/**
 * Four cabins, open onto the corridor along their length, split by a walled
 * niche at x = 9..11. Each lamp hangs at the cabin's far end: a soul lantern
 * (light 10), because a 15-light lantern that close to the corridor lights the
 * spawner reach above 7 (the Windmill's Lmax).
 */
export const ROOMS: readonly { z: number; x0: number; x1: number; lamp: Point; chests: readonly { at: Point; facing: Facing }[] }[] = [
  { z: 2, x0: 5, x1: 8, lamp: [5, 2, 2], chests: [{ at: [6, 1, 2], facing: "south" }, { at: [8, 1, 2], facing: "south" }] },
  { z: 2, x0: 12, x1: 15, lamp: [15, 2, 2], chests: [{ at: [12, 1, 2], facing: "south" }, { at: [14, 1, 2], facing: "south" }] },
  { z: 4, x0: 5, x1: 8, lamp: [5, 2, 4], chests: [{ at: [6, 1, 4], facing: "north" }, { at: [8, 1, 4], facing: "north" }] },
  { z: 4, x0: 12, x1: 15, lamp: [15, 2, 4], chests: [{ at: [12, 1, 4], facing: "north" }, { at: [14, 1, 4], facing: "north" }] },
];

/** Two chests in the niches either side of the spawner, facing into the corridor. */
export const CORRIDOR_CHESTS: readonly { at: Point; facing: Facing }[] = [
  { at: [MID_X, 1, AXIS_Z - 1], facing: "south" },
  { at: [MID_X, 1, AXIS_Z + 1], facing: "north" },
];

export const CHESTS: readonly { at: Point; facing: Facing }[] = [...ROOMS.flatMap((r) => r.chests), ...CORRIDOR_CHESTS];

/** Lit tips: bow, stern and the outer end of every fin. */
export const LIGHTS: readonly Point[] = [
  [1, AXIS_Y, AXIS_Z],
  [27, AXIS_Y, AXIS_Z],
  [FINS.x1, FINS.y0, AXIS_Z],
  [FINS.x1, FINS.y1, AXIS_Z],
  [FINS.x1, AXIS_Y, FINS.z0],
  [FINS.x1, AXIS_Y, FINS.z1],
];

export function inEnvelope(x: number, y: number, z: number): boolean {
  const d = ENVELOPE_DIAMETER[x] ?? 0;
  if (d === 0) return false;
  const dy = Math.abs(y - AXIS_Y);
  return dy <= (d - 1) / 2 && Math.abs(z - AXIS_Z) <= HALF[d][dy];
}

const key = (x: number, y: number, z: number): string => `${x},${y},${z}`;

const AIR: TemplateBlock = { name: "minecraft:air" };
const GRAY: TemplateBlock = { name: "minecraft:gray_concrete" };
const LIGHT_GRAY: TemplateBlock = { name: "minecraft:light_gray_concrete" };
const GLASS: TemplateBlock = { name: "minecraft:glass" };
const IRON: TemplateBlock = { name: "minecraft:iron_block" };
const LIGHT: TemplateBlock = { name: "minecraft:sea_lantern" };
const TOP_SLAB: TemplateBlock = { name: "minecraft:smooth_stone_slab", states: { "minecraft:vertical_half": "bottom" } };
const UNDER_SLAB: TemplateBlock = { name: "minecraft:polished_andesite_slab", states: { "minecraft:vertical_half": "top" } };

type Put = (x: number, y: number, z: number, b: TemplateBlock) => void;

/** Shaded like a lit cylinder: the lower third darker. */
const envelopeBlock = (y: number): TemplateBlock => (y <= AXIS_Y - 2 ? GRAY : LIGHT_GRAY);

/** Solid, so the envelope holds no space for anything (§5.1: decoration only). */
function envelope(set: Put): void {
  const [sx, sy, sz] = AIRSHIP_SIZE;
  for (let x = 0; x < sx; x++) for (let y = GONDOLA.roofY + 1; y < sy; y++) for (let z = 0; z < sz; z++) if (inEnvelope(x, y, z)) set(x, y, z, envelopeBlock(y));

  // A half block over every step up to a neighbouring column and under every
  // step down, so the stepped outline reads as a curve.
  const column = (x: number, z: number): [number, number] | undefined => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let y = 0; y < sy; y++)
      if (inEnvelope(x, y, z)) {
        lo = Math.min(lo, y);
        hi = Math.max(hi, y);
      }
    return hi < lo ? undefined : [lo, hi];
  };
  for (let x = 0; x < sx; x++)
    for (let z = 0; z < sz; z++) {
      const own = column(x, z);
      if (own === undefined) continue;
      const near = [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].map(([nx, nz]) => column(nx, nz)).filter((c) => c !== undefined);
      if (near.some(([, hi]) => hi > own[1])) set(x, own[1] + 1, z, TOP_SLAB);
      if (near.some(([lo]) => lo < own[0]) && own[0] - 1 > GONDOLA.roofY) set(x, own[0] - 1, z, UNDER_SLAB);
    }
}

/** Four fins in a cross; each fills its plane out to the fin box beyond the envelope. */
function fins(set: Put): void {
  for (let x = FINS.x0; x <= FINS.x1; x++) {
    for (let y = FINS.y0; y <= FINS.y1; y++) if (!inEnvelope(x, y, AXIS_Z)) set(x, y, AXIS_Z, IRON);
    for (let z = FINS.z0; z <= FINS.z1; z++) if (!inEnvelope(x, AXIS_Y, z)) set(x, AXIS_Y, z, IRON);
  }
}

function gondola(set: Put): void {
  const { x0, x1, z0, z1, floorY, roofY } = GONDOLA;
  for (let x: number = x0; x <= x1; x++)
    for (let z: number = z0; z <= z1; z++)
      for (let y: number = floorY; y <= roofY; y++) {
        const end = x === x0 || x === x1;
        // The bow and stern walls stop short of floor and roof, a rounded nose; the doors keep their sill.
        if (end && (y === roofY || (y === floorY && z !== AXIS_Z))) continue;
        const wall = end || z === z0 || z === z1;
        if (y === floorY) set(x, y, z, wall ? GRAY : LIGHT_GRAY);
        else if (y === roofY) set(x, y, z, GRAY);
        else if (!wall) set(x, y, z, AIR);
        else set(x, y, z, y === 2 ? GLASS : GRAY);
      }

  // The niche walls between the cabins; the niche itself keeps air over its chest.
  for (let y = floorY + 1; y < roofY; y++) for (const z of [AXIS_Z - 1, AXIS_Z + 1]) for (const x of [MID_X - 1, MID_X + 1]) set(x, y, z, LIGHT_GRAY);

  for (const d of DOORS) {
    set(...d.lower, { name: "minecraft:wooden_door", states: { upper_block_bit: false, "minecraft:cardinal_direction": d.facing, open_bit: false, door_hinge_bit: false } });
    set(...d.upper, { name: "minecraft:wooden_door", states: { upper_block_bit: true, "minecraft:cardinal_direction": d.facing, open_bit: false, door_hinge_bit: false } });
  }
  for (const r of ROOMS) set(...r.lamp, { name: "minecraft:soul_lantern", states: { hanging: true } });
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

  envelope(set);
  fins(set);
  gondola(set);
  for (const p of LIGHTS) set(...p, LIGHT);
  for (const c of CHESTS) set(...c.at, { name: "minecraft:chest", states: { "minecraft:cardinal_direction": c.facing }, chest: { items: [] } });
  set(...SPAWNER.at, { name: "minecraft:mob_spawner", spawner: { entity: SPAWNER.entity } });

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
