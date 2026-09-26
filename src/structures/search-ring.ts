// Ring search (L0-strf-d004, L0-airs-r004): candidates whose footprint centre
// lies between rMin and rMax blocks (horizontal) of a parent's centre, each
// judged by the ordinary site check once its chunks are loaded. The ring is
// never widened and nothing is prepared: a ring with no valid spot ends with
// no structure. Pure apart from the RingLoader, so node tests drive it.

import type { BlockView } from "./site";
import type { SiteVerdict } from "./discovery";
import type { RollDef } from "./config";
import type { DimShort, Rotation, Vec3 } from "./registry";
import { COLLISION_MARGIN } from "./registry";
import { type Candidate, hash32, rotatedSize } from "./roll";

const CHUNK = 16;

export interface RingSpec {
  rMin: number;
  rMax: number;
  /** Gap between the concentric circles candidates are laid on. */
  radialStep: number;
  /** Arc length between neighbouring candidates on one circle. */
  arcStep: number;
}

/** Loads the chunks under an inclusive x/z box; resolves with the remover, or undefined when they never loaded. */
export interface RingLoader {
  load(min: [number, number], max: [number, number]): Promise<(() => void) | undefined>;
}

export interface RingCandidate extends Candidate {
  /** Horizontal distance from the parent's centre to this footprint's centre. */
  distance: number;
}

/** Footprint centre as the registry reports it (runtime `centreOf`). */
export const footprintCentre = (c: Pick<Candidate, "x" | "z" | "size">): [number, number] => [
  c.x + Math.floor(c.size[0] / 2),
  c.z + Math.floor(c.size[2] / 2),
];

/**
 * Every ring candidate, in a seeded order: one per point on circles rMin,
 * rMin+step … rMax, with a seeded rotation each. `key` makes the order and the
 * rotations specific to one parent (ASSUMPTION L0-airs-as02: the spec fixes
 * only the two radii, not the sampling pattern).
 */
export function ringCandidates(key: string, idOf: (i: number) => string, def: RollDef, dim: DimShort, centre: [number, number], spec: RingSpec): RingCandidate[] {
  const out: RingCandidate[] = [];
  const seen = new Set<string>();
  for (let r = spec.rMin; r <= spec.rMax; r += spec.radialStep) {
    const n = Math.max(1, Math.ceil((2 * Math.PI * r) / spec.arcStep));
    const phase = (hash32(`${key}|phase|${r}`) / 0x100000000) * 2 * Math.PI;
    for (let k = 0; k < n; k++) {
      const a = phase + (2 * Math.PI * k) / n;
      const px = Math.round(centre[0] + r * Math.cos(a));
      const pz = Math.round(centre[1] + r * Math.sin(a));
      const rot = (hash32(`${key}|rot|${px}|${pz}`) % 4) as Rotation;
      const size = rotatedSize(def.size, rot);
      const x = px - Math.floor(size[0] / 2);
      const z = pz - Math.floor(size[2] / 2);
      const [fx, fz] = footprintCentre({ x, z, size });
      const distance = Math.hypot(fx - centre[0], fz - centre[1]);
      // Rounding can push a point just past either radius; such a point is dropped, never kept.
      if (distance < spec.rMin || distance > spec.rMax) continue;
      const k2 = `${x},${z},${rot}`;
      if (seen.has(k2)) continue;
      seen.add(k2);
      out.push({ id: "", def, dim, cx: Math.floor(x / CHUNK), cz: Math.floor(z / CHUNK), rot, size, x, z, distance });
    }
  }
  // Seeded Fisher–Yates: the order is a pure function of the key.
  for (let i = out.length - 1; i > 0; i--) {
    const j = hash32(`${key}|order|${i}`) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.map((c, i) => ({ ...c, id: idOf(i) }));
}

/** Whether two footprints overlap in x/z, whatever their heights. */
export function overlaps2d(a: { x: number; z: number; size: Vec3 }, b: { x: number; z: number; size: Vec3 }): boolean {
  return a.x < b.x + b.size[0] && b.x < a.x + a.size[0] && a.z < b.z + b.size[2] && b.z < a.z + a.size[2];
}

/** The chunks a site check of `c` reads: footprint plus the collision margin. */
export function loadBoxOf(c: Pick<Candidate, "x" | "z" | "size">): { min: [number, number]; max: [number, number] } {
  return {
    min: [c.x - COLLISION_MARGIN, c.z - COLLISION_MARGIN],
    max: [c.x + c.size[0] - 1 + COLLISION_MARGIN, c.z + c.size[2] - 1 + COLLISION_MARGIN],
  };
}

export interface RingSearchOptions {
  /** A body's own veto, judged before anything is loaded; returns the reason. */
  exclude(c: RingCandidate): string | undefined;
  loader: RingLoader;
  site(c: RingCandidate): SiteVerdict;
  /**
   * Called with the candidate's chunks still loaded. Returns undefined once the
   * structure is reserved and placed, or the reason it could not take the spot.
   */
  take(c: RingCandidate, y: number): string | undefined;
  /** Candidates loaded at once; each holds one temporary loading area. */
  parallel: number;
  log?: (msg: string) => void;
}

export type RingResult =
  | { kind: "placed"; cand: RingCandidate; y: number; checked: number; rejects: Record<string, number> }
  | { kind: "none"; checked: number; rejects: Record<string, number> }
  /** No valid spot among the loaded candidates, and `pending` could not be read at all. */
  | { kind: "pending"; pending: RingCandidate[]; checked: number; rejects: Record<string, number> };

/** Runs the candidates in order; the first that validates and is taken wins. */
export async function searchRing(cands: readonly RingCandidate[], o: RingSearchOptions): Promise<RingResult> {
  const rejects: Record<string, number> = {};
  const reject = (why: string): void => {
    rejects[why] = (rejects[why] ?? 0) + 1;
  };
  const pending: RingCandidate[] = [];
  let checked = 0;
  const open = cands.filter((c) => {
    const why = o.exclude(c);
    if (why !== undefined) reject(why);
    return why === undefined;
  });
  for (let i = 0; i < open.length; i += o.parallel) {
    const batch = open.slice(i, i + o.parallel);
    const removers = await Promise.all(batch.map((c) => o.loader.load(loadBoxOf(c).min, loadBoxOf(c).max)));
    try {
      for (let k = 0; k < batch.length; k++) {
        const c = batch[k];
        if (removers[k] === undefined) {
          pending.push(c);
          continue;
        }
        checked++;
        const v = o.site(c);
        if (v.kind === "pending") {
          pending.push(c);
          continue;
        }
        if (v.kind === "rejected") {
          reject(v.reason);
          continue;
        }
        const why = o.take(c, v.y);
        if (why === undefined) return { kind: "placed", cand: c, y: v.y, checked, rejects };
        reject(why);
      }
    } finally {
      for (const r of removers) r?.();
    }
  }
  return pending.length > 0 ? { kind: "pending", pending, checked, rejects } : { kind: "none", checked, rejects };
}

/** A loader over already loaded chunks only: it never loads anything itself. */
export function viewLoader(view: BlockView): RingLoader {
  return {
    load: (min, max) => {
      for (let cx = Math.floor(min[0] / CHUNK); cx <= Math.floor(max[0] / CHUNK); cx++)
        for (let cz = Math.floor(min[1] / CHUNK); cz <= Math.floor(max[1] / CHUNK); cz++)
          if (!view.isLoaded(cx * CHUNK, cz * CHUNK)) return Promise.resolve(undefined);
      return Promise.resolve(() => {});
    },
  };
}

// ------------------------------------------------------------ engine adapter

export interface RingSystem {
  runTimeout(callback: () => void, ticks: number): number;
}

const LOAD_TIMEOUT_TICKS = 300;
const ADD_RETRIES = 30;

/**
 * Temporary ticking areas from a small named pool (L0-airs-cx01). The engine
 * caps ticking areas at 10 per world, shared with every other user; a refused
 * add is retried, then reported as never loaded. `prefix` keeps two script
 * contexts from removing each other's areas.
 */
export function engineRingLoader(
  dim: { runCommand(cmd: string): { successCount: number }; isChunkLoaded(l: { x: number; y: number; z: number }): boolean; getBlock(l: { x: number; y: number; z: number }): unknown; heightRange: { min: number } },
  sys: RingSystem,
  prefix: string,
  pool: number
): RingLoader {
  const wait = (ticks: number): Promise<void> => new Promise((resolve) => sys.runTimeout(resolve, Math.max(1, ticks)));
  const run = (cmd: string): number => {
    try {
      return dim.runCommand(cmd).successCount;
    } catch {
      return 0;
    }
  };
  const name = (i: number): string => `${prefix}_${i}`;
  // A crash never leaks an area for good: the pool is emptied at startup.
  for (let i = 0; i < pool; i++) run(`tickingarea remove ${name(i)}`);
  const used = new Set<number>();
  const minY = dim.heightRange.min;
  return {
    async load(min, max) {
      // An area added in the tick another was removed can stay unloaded for good (measured on BDS 1.26.51.1).
      await wait(1);
      let slot = -1;
      for (let tries = 0; tries < ADD_RETRIES && slot < 0; tries++) {
        const free = [...Array(pool).keys()].find((i) => !used.has(i));
        if (free !== undefined) {
          used.add(free);
          if (run(`tickingarea add ${min[0]} 0 ${min[1]} ${max[0]} 0 ${max[1]} ${name(free)}`) > 0) slot = free;
          else used.delete(free);
        }
        if (slot < 0) await wait(10);
      }
      if (slot < 0) return undefined;
      const remove = (): void => {
        run(`tickingarea remove ${name(slot)}`);
        used.delete(slot);
      };
      const chunks: Array<{ x: number; y: number; z: number }> = [];
      for (let x = Math.floor(min[0] / CHUNK); x <= Math.floor(max[0] / CHUNK); x++)
        for (let z = Math.floor(min[1] / CHUNK); z <= Math.floor(max[1] / CHUNK); z++) chunks.push({ x: x * CHUNK, y: minY, z: z * CHUNK });
      // At least one tick per area: a ring of already loaded chunks would otherwise run in a single tick.
      await wait(1);
      for (let t = 0; t < LOAD_TIMEOUT_TICKS; t++) {
        if (chunks.every((c) => dim.isChunkLoaded(c) && dim.getBlock(c) !== undefined)) return remove;
        await wait(1);
      }
      remove();
      return undefined;
    },
  };
}
