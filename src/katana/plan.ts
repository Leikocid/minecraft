// Dragon Katana jump geometry: trace, endpoint and safe-cell search (spec §5,
// §6; L0-katn-p001 steps 4–7, L0-katn-r004). @minecraft/server is imported for
// types only: node tests run this file against a fake block reader, and the
// ability passes `player.dimension` as the reader unchanged.

import type { Dimension, Direction, Vector3 } from "@minecraft/server";

/** Spec §5: the farthest the head may move, in blocks. */
export const KATANA_RANGE = 20;
/** L0-katn-p001 §5: the endpoint backs off a hit point by this much toward the head. */
export const PULLBACK = 0.3;
/** L0-katn-r004: the search steps back along the ray by this much. */
export const SEARCH_STEP = 0.5;
/** L0-katn-as03, decision-katana-landing-above-lava-unsafe: hazards, not solids. */
export const HAZARDS: ReadonlySet<string> = new Set([
  "minecraft:lava",
  "minecraft:flowing_lava",
  "minecraft:fire",
  "minecraft:soul_fire",
]);
/** L0-adr-ktob §1: the engine decides what stops the Katana; liquids and passable blocks do not. */
export const TRACE_FLAGS = { includePassableBlocks: false, includeLiquidBlocks: false } as const;
// A ray meets lava only with both flags true; includeLiquidBlocks alone passes it (KATA-PROBE-01 P4).
const HAZARD_FLAGS = { includePassableBlocks: true, includeLiquidBlocks: true } as const;

/** How far short of the first unreadable point the trace ends. */
const UNREADABLE_MARGIN = 0.05;
/** The column ray starts this far under the top of the head cell. */
const COLUMN_EPS = 0.01;
// head − eye height lands a hair under an integer floor in float math; the feet belong on that floor.
const CELL_EPS = 1e-6;
// Entity positions are single-precision: a move that changes y puts the head up
// to ~3e-5 off where double maths has it, so such a move keeps this much in hand.
const FLOAT32_MARGIN = 1e-4;

export interface RayOptions {
  /** A budget of cell steps, not blocks (KATA-PROBE-01 P2b). */
  maxDistance: number;
  includePassableBlocks: boolean;
  includeLiquidBlocks: boolean;
}

export interface RayHit {
  readonly block: { readonly location: Vector3; readonly typeId: string };
  readonly face: Direction;
  readonly faceLocation: Vector3;
}

/**
 * What the plan reads from a dimension. Any call may throw (unloaded chunk,
 * outside the height range); the plan reads a throw as solid.
 */
export interface KatanaWorld {
  /** `max` is the first y above the build limit. */
  readonly heightRange: { readonly min: number; readonly max: number };
  isChunkLoaded(location: Vector3): boolean;
  getBlock(location: Vector3): { readonly typeId: string; readonly isAir: boolean } | undefined;
  getBlockFromRay(location: Vector3, direction: Vector3, options: RayOptions): RayHit | undefined;
}

type Expect<T extends true> = T;
/** `planTeleport(player.dimension, …)` must keep compiling. */
export type DimensionIsKatanaWorld = Expect<Dimension extends KatanaWorld ? true : false>;

export type StopReason = "block" | "unreadable" | "range";

/** L0-katn-ent2. `feet` undefined is a refusal: no teleport, no cooldown. */
export interface TeleportPlan {
  /** A: feet at use. */
  readonly origin: Vector3;
  /** H: head at use. */
  readonly head: Vector3;
  /** Unit view direction at use. */
  readonly dir: Vector3;
  /** E: the hit point pulled back toward H, or H + range·dir. */
  readonly endpoint: Vector3;
  readonly hitFace: Direction | undefined;
  readonly stoppedBy: StopReason;
  /** B: the centre of the chosen feet cell, on its floor. */
  readonly feet: Vector3 | undefined;
}

const AXES = ["x", "y", "z"] as const;
const UP: Vector3 = { x: 0, y: 1, z: 0 };
const DOWN: Vector3 = { x: 0, y: -1, z: 0 };
const FACE_NORMALS: Record<string, Vector3> = {
  Up: UP,
  Down: DOWN,
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 },
  South: { x: 0, y: 0, z: 1 },
  North: { x: 0, y: 0, z: -1 },
};

const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const scale = (a: Vector3, k: number): Vector3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const dot = (a: Vector3, b: Vector3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const norm = (a: Vector3): number => Math.hypot(a.x, a.y, a.z);
const distance = (a: Vector3, b: Vector3): number => norm(sub(a, b));
const above = (cell: Vector3, dy = 1): Vector3 => ({ x: cell.x, y: cell.y + dy, z: cell.z });
const key = (cell: Vector3): string => `${cell.x},${cell.y},${cell.z}`;
const sameCell = (a: Vector3, b: Vector3): boolean => a.x === b.x && a.y === b.y && a.z === b.z;
/** The block cell a point lies in, as the engine counts it. */
const blockAt = (p: Vector3): Vector3 => ({ x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) });
const feetCellAt = (p: Vector3): Vector3 => blockAt(add(p, { x: CELL_EPS, y: CELL_EPS, z: CELL_EPS }));
const cellCentre = (cell: Vector3): Vector3 => add(cell, { x: 0.5, y: 0.5, z: 0.5 });
/** Where the player stands in a feet cell (L0-katn-r004 "Placement"). */
const placement = (cell: Vector3): Vector3 => ({ x: cell.x + 0.5, y: cell.y, z: cell.z + 0.5 });
const manhattan = (a: Vector3, b: Vector3): number => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z);

interface Crossing {
  cell: Vector3;
  /** Distance along the ray at which it enters the cell. */
  t: number;
}

/**
 * Cells a ray visits, one axis crossing per step — the walk whose step count
 * the engine's `maxDistance` budgets (KATA-PROBE-01 P2b). Ends with the first
 * cell entered beyond `length`.
 */
function cellsAlong(from: Vector3, dir: Vector3, length: number): Crossing[] {
  const cell = blockAt(from);
  const next = { x: Infinity, y: Infinity, z: Infinity };
  const delta = { x: Infinity, y: Infinity, z: Infinity };
  for (const a of AXES) {
    if (dir[a] !== 0) {
      next[a] = ((dir[a] > 0 ? cell[a] + 1 : cell[a]) - from[a]) / dir[a];
      delta[a] = 1 / Math.abs(dir[a]);
    }
  }
  const out: Crossing[] = [{ cell: { ...cell }, t: 0 }];
  for (;;) {
    const a = next.x <= next.y && next.x <= next.z ? "x" : next.y <= next.z ? "y" : "z";
    const t = next[a];
    if (!Number.isFinite(t)) {
      return out;
    }
    cell[a] += Math.sign(dir[a]);
    next[a] += delta[a];
    out.push({ cell: { ...cell }, t });
    if (t > length) {
      return out;
    }
  }
}

/** Inside the height range and in a loaded chunk; one chunk query per chunk. */
function readability(world: KatanaWorld): (cell: Vector3) => boolean {
  const chunks = new Map<string, boolean>();
  return (cell) => {
    if (cell.y < world.heightRange.min || cell.y >= world.heightRange.max) {
      return false;
    }
    const chunk = `${Math.floor(cell.x / 16)},${Math.floor(cell.z / 16)}`;
    let loaded = chunks.get(chunk);
    if (loaded === undefined) {
      try {
        loaded = world.isChunkLoaded(cell);
      } catch {
        loaded = false;
      }
      chunks.set(chunk, loaded);
    }
    return loaded;
  };
}

type Block = { readonly typeId: string; readonly isAir: boolean };

function read(world: KatanaWorld, cell: Vector3): Block | undefined {
  try {
    return world.getBlock(cell);
  } catch {
    return undefined;
  }
}

/** `undefined` is no hit; `"threw"` is a ray that left the readable world. */
function cast(world: KatanaWorld, from: Vector3, dir: Vector3, options: RayOptions): RayHit | undefined | "threw" {
  try {
    return world.getBlockFromRay(from, dir, options);
  } catch {
    return "threw";
  }
}

/**
 * The hit point in world space. `faceLocation` is the point's fractional part,
 * so a hit on a cell's +1 plane (a full Up, East or South face) reads 0 there.
 */
function hitPoint(hit: RayHit): Vector3 {
  const n: Vector3 | undefined = FACE_NORMALS[hit.face];
  const f = hit.faceLocation;
  const b = hit.block.location;
  const wrap = (v: number, axis: number): number => (axis === 1 && v === 0 ? 1 : v);
  return { x: b.x + wrap(f.x, n?.x ?? 0), y: b.y + wrap(f.y, n?.y ?? 0), z: b.z + wrap(f.z, n?.z ?? 0) };
}

export interface Hit {
  face: Direction;
  block: Vector3;
  point: Vector3;
}

export interface Trace {
  endpoint: Vector3;
  stoppedBy: StopReason;
  hit: Hit | undefined;
  /** The ray threw: where the solid lies is unknown, so nothing is offered. */
  failed: boolean;
}

/** L0-katn-p001 steps 4–5. `dir` is a unit vector; the Storm Blade passes its own `range` (L0-strm-adtr). */
export function trace(world: KatanaWorld, head: Vector3, dir: Vector3, range: number = KATANA_RANGE): Trace {
  const walk = cellsAlong(head, dir, range);
  const readable = readability(world);
  let reach = range;
  let stoppedBy: StopReason = "range";
  const blind = walk.find((s) => s.t <= range && !readable(s.cell));
  if (blind !== undefined) {
    reach = Math.max(0, blind.t - UNREADABLE_MARGIN);
    stoppedBy = "unreadable";
  }
  let last = 0;
  while (walk[last + 1].t <= reach) {
    last++;
  }
  // A part-block is caught only as the ray steps out of its cell (P3), so the
  // ray runs one cell past the end — unless that cell is unreadable, where a
  // step into it throws or silently misses (P5).
  const steps = last + (readable(walk[last + 1].cell) ? 1 : 0);
  if (reach > 0 && steps > 0) {
    const hit = cast(world, head, dir, { ...TRACE_FLAGS, maxDistance: steps });
    if (hit === "threw") {
      return { endpoint: head, stoppedBy: "unreadable", hit: undefined, failed: true };
    }
    if (hit !== undefined) {
      const point = hitPoint(hit);
      const t = distance(point, head);
      // The step budget reaches past `reach`; the Euclidean cut is ours.
      if (t <= reach) {
        return {
          endpoint: sub(point, scale(dir, Math.min(PULLBACK, t))),
          stoppedBy: "block",
          hit: { face: hit.face, block: hit.block.location, point },
          failed: false,
        };
      }
    }
  }
  return { endpoint: add(head, scale(dir, reach)), stoppedBy, hit: undefined, failed: false };
}

/**
 * The first block a ray down from the feet cell meets, or the block above it,
 * is lava or fire. Fire is invisible to block rays: the ray returns the block
 * under it, and only `getBlock` one up reads the fire (P4).
 */
function hazardBelow(world: KatanaWorld, feet: Vector3): boolean {
  const steps = feet.y - world.heightRange.min;
  if (steps <= 0) {
    return false;
  }
  const hit = cast(world, cellCentre(feet), DOWN, { ...HAZARD_FLAGS, maxDistance: steps });
  if (hit === "threw") {
    return true;
  }
  if (hit === undefined) {
    return false;
  }
  if (HAZARDS.has(hit.block.typeId)) {
    return true;
  }
  const over = read(world, above(hit.block.location));
  return over === undefined || HAZARDS.has(over.typeId);
}

/**
 * A standing player fits in `feet` and its head cell, neither is lava or fire,
 * and nothing under them drops the player into lava or fire (L0-katn-r004 §1–2,
 * L0-katn-ad01, decision-katana-landing-above-lava-unsafe).
 */
export function standsSafely(world: KatanaWorld, feet: Vector3): boolean {
  const lower = read(world, feet);
  const upper = read(world, above(feet));
  if (lower === undefined || upper === undefined) {
    return false;
  }
  if (HAZARDS.has(lower.typeId) || HAZARDS.has(upper.typeId)) {
    return false;
  }
  let onFloor = false;
  if (!(lower.isAir && upper.isAir)) {
    // Length 2 from just under the head cell's top ends just inside the cell
    // below; 2−2ε misses a bottom slab in the feet cell (P3). A hit below is the floor.
    const top = { x: feet.x + 0.5, y: feet.y + 2 - COLUMN_EPS, z: feet.z + 0.5 };
    const hit = cast(world, top, DOWN, { ...TRACE_FLAGS, maxDistance: 2 });
    if (hit === "threw") {
      return false;
    }
    if (hit !== undefined) {
      if (!sameCell(hit.block.location, above(feet, -1))) {
        return false;
      }
      onFloor = true;
    }
  }
  return onFloor || !hazardBelow(world, feet);
}

/** L0-katn-r004 §4: a clear trace ray from H to the centre of the candidate's head cell. */
function reachable(world: KatanaWorld, head: Vector3, feet: Vector3): boolean {
  const target = cellCentre(above(feet));
  const delta = sub(target, head);
  const len = norm(delta);
  const steps = manhattan(blockAt(head), above(feet));
  if (steps === 0 || len === 0) {
    return true;
  }
  return cast(world, head, scale(delta, 1 / len), { ...TRACE_FLAGS, maxDistance: steps }) === undefined;
}

/**
 * L0-katn-r004 §5: |B + (0, eye, 0) − H| ≤ 20. The head keeps its offset above
 * the feet, so it moves exactly as far as the feet do.
 */
function inRange(origin: Vector3, feet: Vector3): boolean {
  return distance(feet, origin) <= KATANA_RANGE - (feet.y === origin.y ? 0 : FLOAT32_MARGIN);
}

/** L0-katn-r004 §3: the cell's centre is on the head's side of the hit face's plane. */
function onOwnersSide(cell: Vector3, head: Vector3, hit: Hit): boolean {
  const n: Vector3 | undefined = FACE_NORMALS[hit.face];
  if (n === undefined) {
    return true;
  }
  return dot(sub(cellCentre(cell), hit.point), n) * dot(sub(head, hit.point), n) > 0;
}

/** Horizontal unit vector to the right of `dir`; none when looking straight up or down. */
function sideOf(dir: Vector3): Vector3 | undefined {
  const h = Math.hypot(dir.x, dir.z);
  return h < 1e-6 ? undefined : { x: -dir.z / h, y: 0, z: dir.x / h };
}

/** L0-katn-p001 steps 6–7. */
function findFeet(world: KatanaWorld, origin: Vector3, head: Vector3, dir: Vector3, tr: Trace): Vector3 | undefined {
  const eye = sub(head, origin);
  const hit = tr.hit;
  const floorHit = hit !== undefined && FACE_NORMALS[hit.face]?.y === 1;
  // Floor hit: the feet go on the floor. Otherwise the head goes where the player looked.
  const feetPoint = floorHit ? tr.endpoint : sub(tr.endpoint, eye);
  const desired = floorHit ? above(hit.block) : feetCellAt(feetPoint);
  const own = feetCellAt(origin);
  const tried = new Set<string>([key(own)]);
  const side = sideOf(dir);
  const total = distance(tr.endpoint, head);

  const accepts = (cell: Vector3): boolean =>
    inRange(origin, placement(cell)) &&
    (hit === undefined || onOwnersSide(cell, head, hit)) &&
    standsSafely(world, cell) &&
    reachable(world, head, cell);

  for (let k = 0; k * SEARCH_STEP <= total; k++) {
    const base = k === 0 ? desired : feetCellAt(sub(feetPoint, scale(dir, k * SEARCH_STEP)));
    if (sameCell(base, own)) {
      return undefined;
    }
    const around = [base, above(base), above(base, 2)];
    if (side !== undefined) {
      around.push(blockAt(add(cellCentre(base), side)), blockAt(sub(cellCentre(base), side)));
    }
    for (const cell of around) {
      if (tried.has(key(cell))) {
        continue;
      }
      tried.add(key(cell));
      if (accepts(cell)) {
        return placement(cell);
      }
    }
  }
  return undefined;
}

/**
 * Where the Katana puts a player who used it at `origin` with the head at
 * `head`, looking along `view` — read once at use (spec §5). Reads blocks, never
 * writes them.
 */
export function planTeleport(world: KatanaWorld, origin: Vector3, head: Vector3, view: Vector3): TeleportPlan {
  const len = norm(view);
  if (len === 0) {
    return { origin, head, dir: view, endpoint: head, hitFace: undefined, stoppedBy: "range", feet: undefined };
  }
  const dir = scale(view, 1 / len);
  const tr = trace(world, head, dir);
  const feet = tr.failed ? undefined : findFeet(world, origin, head, dir, tr);
  return { origin, head, dir, endpoint: tr.endpoint, hitFace: tr.hit?.face, stoppedBy: tr.stoppedBy, feet };
}
