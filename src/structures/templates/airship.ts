// The Airship template (§5.1–§5.3, L0-airs-r001/r002): one fixed modern,
// undamaged airship, compiled by scripts/build-structures.mjs into
// packs/behavior/structures/andrew/airship.mcstructure (engine id
// "andrew:airship"). Only rotation varies at placement.
//
// Template-local axes: x west→east (the long axis, bow at x = 1), y up, z
// north→south. A hollow round envelope 73 long and 13 across (x 1..73, y
// 4..16) with four tail fins sits straight on a gondola 13 × 7 (x 14..26,
// y 0..3): Zeppelin NT proportions, a deliberate departure from the ≈15 of
// §5.1, which cannot hold the gondola's contents and still read as an airship.
//
// Pure data, no @minecraft/server: the GameTest pack imports the named points
// below, node evaluates the default export at build time.

import type { TemplateBlock } from "./windmill-fields";

export type Point = readonly [number, number, number];

export const AIRSHIP_ID = "andrew:airship";
export const AIRSHIP_SIZE: Point = [75, 18, 13];

/** Envelope axis: every station is a round section centred here. */
export const AXIS_Y = 10;
export const AXIS_Z = 6;

/** First and last envelope station; x = 0 and x = 74 stay empty. */
const BOW_X = 1;
const STERN_X = 73;

/**
 * Envelope diameter per station x: a blunt bow reaching 13 within 8 blocks,
 * 13 held to 45 % of the length, then down to 1 in two-block steps.
 */
export const ENVELOPE_DIAMETER: readonly number[] = (() => {
  const bow = [1, 3, 5, 7, 9, 11, 13, 13];
  const lastFull = BOW_X + Math.floor(0.45 * (STERN_X - BOW_X + 1));
  const tail: [number, number][] = [[11, 10], [9, 9], [7, 7], [5, 6], [3, 5], [1, 3]];
  const out = [0, ...bow];
  while (out.length <= lastFull) out.push(13);
  for (const [d, n] of tail) for (let i = 0; i < n; i++) out.push(d);
  if (out.length !== STERN_X + 1) throw new Error(`airship: envelope table ends at x=${out.length - 1}, not ${STERN_X}`);
  out.push(0);
  return out;
})();

/** Half-width of a round section of diameter d at |dy| rows off the axis; 3 is a cross, so its top is not flat. */
const HALF: Readonly<Record<number, readonly number[]>> = {
  1: [0],
  3: [1, 0],
  5: [2, 2, 1],
  7: [3, 3, 2, 1],
  9: [4, 4, 4, 3, 2],
  11: [5, 5, 5, 4, 3, 2],
  13: [6, 6, 6, 5, 5, 4, 2],
};

export const GONDOLA = { x0: 14, x1: 26, z0: 3, z1: 9, floorY: 0, roofY: 3 } as const;
const MID_X = 20;

/**
 * Fins: chord x 57..72, the vertical pair in the plane z = AXIS_Z reaching 7
 * off the axis (one past the envelope, into the template's top row), the
 * horizontal pair in y = AXIS_Y reaching the template's sides. The leading
 * edge is swept: reach grows a block every three stations.
 */
export const FINS = { x0: 57, x1: 72, reachY: 7, reachZ: 6 } as const;
export const finReach = (x: number, max: number): number => (x < FINS.x0 || x > FINS.x1 ? 0 : Math.min(max, 4 + Math.floor((x - FINS.x0) / 3)));

/** Doors on the bow and stern ends of the corridor, facing each other along it. */
export const DOORS: readonly { lower: Point; upper: Point; facing: "east" | "west" }[] = [
  { lower: [GONDOLA.x0, 1, AXIS_Z], upper: [GONDOLA.x0, 2, AXIS_Z], facing: "east" },
  { lower: [GONDOLA.x1, 1, AXIS_Z], upper: [GONDOLA.x1, 2, AXIS_Z], facing: "west" },
];

/** In the corridor floor, so the corridor stays walkable door to door. */
export const SPAWNER: { at: Point; entity: string } = { at: [MID_X, GONDOLA.floorY, AXIS_Z], entity: "minecraft:vindicator" };

type Facing = "north" | "east" | "south" | "west";

/**
 * Four cabins 5 × 2, open onto the corridor along their length, split by a
 * wall at x = MID_X. The chests stand on the outer row; each lamp hangs in the
 * outer corner farthest from the spawner: a soul lantern (light 10), because a
 * 15-light lantern lights the corridor inside the spawner's reach above 7.
 */
export const ROOMS: readonly { z: readonly [number, number]; x0: number; x1: number; lamp: Point; chests: readonly { at: Point; facing: Facing }[] }[] = [
  { z: [4, 5], x0: 15, x1: 19, lamp: [15, 2, 4], chests: [{ at: [16, 1, 4], facing: "south" }, { at: [18, 1, 4], facing: "south" }] },
  { z: [4, 5], x0: 21, x1: 25, lamp: [25, 2, 4], chests: [{ at: [22, 1, 4], facing: "south" }, { at: [24, 1, 4], facing: "south" }] },
  { z: [7, 8], x0: 15, x1: 19, lamp: [15, 2, 8], chests: [{ at: [16, 1, 8], facing: "north" }, { at: [18, 1, 8], facing: "north" }] },
  { z: [7, 8], x0: 21, x1: 25, lamp: [25, 2, 8], chests: [{ at: [22, 1, 8], facing: "north" }, { at: [24, 1, 8], facing: "north" }] },
];

/**
 * Two chests set into the corridor floor either side of the spawner, opened
 * from the corridor above: a chest does not open under a solid block, and air
 * over a chest in the cabin wall would join the two cabins it divides.
 */
export const CORRIDOR_CHESTS: readonly { at: Point; facing: Facing }[] = [
  { at: [MID_X - 3, GONDOLA.floorY, AXIS_Z], facing: "east" },
  { at: [MID_X + 3, GONDOLA.floorY, AXIS_Z], facing: "west" },
];

export const CHESTS: readonly { at: Point; facing: Facing }[] = [...ROOMS.flatMap((r) => r.chests), ...CORRIDOR_CHESTS];

/**
 * The keel's lowest shell block every 8 stations. The sealed inside of the
 * hollow envelope is a dark cave in the sky; at block light 0 hostile mobs
 * spawn in it, so each floor cell inside is kept at 1 or more.
 */
export const BELLY_LIGHTS: readonly Point[] = [8, 16, 24, 32, 40, 48, 56].map((x) => [x, AXIS_Y - (ENVELOPE_DIAMETER[x] - 1) / 2, AXIS_Z] as const);

/** Lit tips: bow, stern and the outer end of every fin; and the belly. */
export const LIGHTS: readonly Point[] = [
  [BOW_X, AXIS_Y, AXIS_Z],
  [STERN_X, AXIS_Y, AXIS_Z],
  [FINS.x1, AXIS_Y - FINS.reachY, AXIS_Z],
  [FINS.x1, AXIS_Y + FINS.reachY, AXIS_Z],
  [FINS.x1, AXIS_Y, AXIS_Z - FINS.reachZ],
  [FINS.x1, AXIS_Y, AXIS_Z + FINS.reachZ],
  ...BELLY_LIGHTS,
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

const N6: readonly Point[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

/**
 * A shell one block thick: the cells with a face outside the envelope. The
 * inside is air and nothing else (§5.1: decoration only); stations under 5
 * across stay solid, so the lit tips cap a closed shell.
 */
function envelope(set: Put): void {
  const [sx, sy, sz] = AIRSHIP_SIZE;
  const shell = (x: number, y: number, z: number): boolean => ENVELOPE_DIAMETER[x] < 5 || N6.some(([dx, dy, dz]) => !inEnvelope(x + dx, y + dy, z + dz));
  for (let x = 0; x < sx; x++)
    for (let y = GONDOLA.roofY + 1; y < sy; y++)
      for (let z = 0; z < sz; z++) if (inEnvelope(x, y, z)) set(x, y, z, shell(x, y, z) ? envelopeBlock(y) : AIR);

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

/** Four fins in a cross; each fills its plane from the envelope out to its reach at that station. */
function fins(set: Put): void {
  for (let x = FINS.x0; x <= FINS.x1; x++) {
    const ry = finReach(x, FINS.reachY);
    const rz = finReach(x, FINS.reachZ);
    for (let y = AXIS_Y - ry; y <= AXIS_Y + ry; y++) if (!inEnvelope(x, y, AXIS_Z)) set(x, y, AXIS_Z, IRON);
    for (let z = AXIS_Z - rz; z <= AXIS_Z + rz; z++) if (!inEnvelope(x, AXIS_Y, z)) set(x, AXIS_Y, z, IRON);
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

  // The walls between the fore and aft cabins on each side.
  for (let y = floorY + 1; y < roofY; y++) for (let z = z0 + 1; z < z1; z++) if (z !== AXIS_Z) set(MID_X, y, z, LIGHT_GRAY);

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
