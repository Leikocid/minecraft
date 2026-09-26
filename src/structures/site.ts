// Site check of a candidate and its occupation (L0-strf-p002, L0-strf-r005..r007).
// Order is the contract: loaded gate, then profile reads, then collision; a
// candidate is written only right after a check in the same call found every
// covered chunk loaded. Engine objects come in through BlockView, so node
// tests run this with a fake world.

import type { BlockTypes, BlockVolume, Dimension } from "@minecraft/server";
import { type Box, type CollisionKind, collisionBox, instanceCollision, scanCollision } from "./collision";
import { ROLL_DEFS, type StructureId } from "./config";
import type { Site, SiteVerdict } from "./discovery";
import { PendingSites } from "./pending";
import {
  type NetherColumn,
  type NetherFloorSpec,
  PROFILES,
  type ProfileResult,
  type SiteProfile,
  type SurfaceSample,
  altitude,
  depth,
  dryLand,
  flat,
  netherFloor,
  surfaceY,
} from "./profiles";
import { type DimShort, type Instance, type Registry, type Vec3, COLLISION_MARGIN } from "./registry";
import { type Candidate, rollUnit } from "./roll";

const CHUNK = 16;
/** Footprints up to this side are sampled every 2 blocks, larger ones every 4 (L0-strf-p002). */
const FINE_SAMPLING_MAX_SIDE = 20;
const GROUND_WALK_LIMIT = 64;

/** What the site check reads. Every read returns undefined for an unloaded location instead of throwing. */
export interface BlockView {
  /** `heightRange.min`: the lowest buildable Y. */
  readonly minY: number;
  /** `heightRange.max`: the first Y above the build limit. */
  readonly maxY: number;
  isLoaded(x: number, z: number): boolean;
  /** Topmost non-air block of the column; `typeId` air with `y = minY - 1` for an empty column. */
  topmost(x: number, z: number): { y: number; typeId: string } | undefined;
  typeAt(x: number, y: number, z: number): string | undefined;
  /** Whether any block of these types lies in the inclusive box; undefined if part of it is unloaded. */
  contains(min: [number, number, number], max: [number, number, number], types: readonly string[]): boolean | undefined;
}

const AIR = "minecraft:air";
const LIQUID = /^minecraft:(flowing_)?(water|lava)$/;
const WATERY_TOP = /^minecraft:(seagrass|kelp|kelp_plant|bubble_column|waterlily)$/;
/** Neither a floor nor a surface: foliage, trunks and plants (L0-xasm4 §4). */
const FOLIAGE =
  /(leaves|_log$|_wood$|_stem$|_hyphae$|mushroom_block|vine|sapling|flower|tulip|rose_bush|dandelion|poppy|orchid|allium|bluet|daisy|cornflower|lily_of|short_grass|tall_grass|^minecraft:grass$|fern|bush|snow_layer|sugar_cane|^minecraft:bamboo$|cactus|azalea|moss_carpet|pink_petals|leaf_litter|wildflowers|dripleaf|hanging_roots|glow_lichen|roots$|fungus$|sprouts$|fire$|torchflower|pitcher|sunflower|lilac|peony|brown_mushroom$|red_mushroom$)/;

export const isLiquid = (t: string): boolean => LIQUID.test(t);
export const isFoliage = (t: string): boolean => FOLIAGE.test(t);
const isLava = (t: string): boolean => t === "minecraft:lava" || t === "minecraft:flowing_lava";
const isFloorBlock = (t: string): boolean => t !== AIR && !isLiquid(t) && t !== "minecraft:bedrock" && !FOLIAGE.test(t);

/** Chunks under the footprint plus the margin, x/z only: height does not matter for loading. */
export function coveredChunks(x: number, z: number, w: number, d: number, margin = COLLISION_MARGIN): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let cx = Math.floor((x - margin) / CHUNK); cx <= Math.floor((x + w - 1 + margin) / CHUNK); cx++) {
    for (let cz = Math.floor((z - margin) / CHUNK); cz <= Math.floor((z + d - 1 + margin) / CHUNK); cz++) out.push([cx, cz]);
  }
  return out;
}

export const footprintLoaded = (view: BlockView, c: Candidate): boolean =>
  coveredChunks(c.x, c.z, c.size[0], c.size[2]).every(([cx, cz]) => view.isLoaded(cx * CHUNK, cz * CHUNK));

/** The grid, the four corners and the centre of a footprint, each column once. */
export function sampleColumns(x: number, z: number, w: number, d: number): Array<[number, number]> {
  const step = Math.max(w, d) <= FINE_SAMPLING_MAX_SIDE ? 2 : 4;
  const seen = new Set<string>();
  const out: Array<[number, number]> = [];
  const add = (sx: number, sz: number): void => {
    const k = `${sx},${sz}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push([sx, sz]);
  };
  for (let i = 0; i < w; i += step) for (let j = 0; j < d; j += step) add(x + i, z + j);
  for (const [i, j] of [[0, 0], [w - 1, 0], [0, d - 1], [w - 1, d - 1]]) add(x + i, z + j);
  add(x + Math.floor(w / 2), z + Math.floor(d / 2));
  return out;
}

/** The centre and the 8-point ring on the footprint's corners and edge midpoints. */
export function centreRing(x: number, z: number, w: number, d: number): Array<[number, number]> {
  const xs = [x, x + Math.floor(w / 2), x + w - 1];
  const zs = [z, z + Math.floor(d / 2), z + d - 1];
  return xs.flatMap((sx) => zs.map((sz): [number, number] => [sx, sz]));
}

/** Undefined when a read hit an unloaded location. */
export function surfaceSample(view: BlockView, x: number, z: number): SurfaceSample | undefined {
  const top = view.topmost(x, z);
  if (top === undefined) return undefined;
  let liquid = isLiquid(top.typeId) || WATERY_TOP.test(top.typeId) || top.typeId === AIR;
  if (top.typeId === "minecraft:ice") {
    const below = view.typeAt(x, top.y - 1, z);
    if (below === undefined) return undefined;
    liquid = isLiquid(below);
  }
  let ground = top.y;
  let type = top.typeId;
  for (let i = 0; i < GROUND_WALK_LIMIT && (type === AIR || FOLIAGE.test(type)) && ground > view.minY; i++) {
    ground--;
    const t = view.typeAt(x, ground, z);
    if (t === undefined) return undefined;
    type = t;
  }
  return { x, z, top: top.y, topType: top.typeId, liquid, ground };
}

/** Downward scan for the first air→solid transition (L0-strf-r013); undefined on an unloaded read. */
export function netherColumn(view: BlockView, x: number, z: number, inner: boolean, spec: NetherFloorSpec): NetherColumn | undefined {
  let prevAir = false;
  let firstSeen = false;
  let lavaSea = false;
  let floor: number | undefined;
  for (let y = spec.scanTop; y >= spec.scanBottom; y--) {
    const t = view.typeAt(x, y, z);
    if (t === undefined) return undefined;
    if (!firstSeen && t !== AIR) {
      firstSeen = true;
      lavaSea = isLava(t) && y <= spec.lavaSeaY;
    }
    if (prevAir && isFloorBlock(t)) {
      floor = y;
      break;
    }
    prevAir = t === AIR;
  }
  if (!firstSeen) {
    const below = view.typeAt(x, spec.scanBottom - 1, z);
    if (below === undefined) return undefined;
    lavaSea = isLava(below);
  }
  return { x, z, floor, lavaSea, inner };
}

/**
 * A second area a candidate writes besides its box, such as the Warden City's
 * surface marker. It passes the same gates as the box — loaded, suitable,
 * collision-free — or the whole candidate is rejected.
 */
export interface ExtraSpot {
  /** Prefix of the spot's reject reasons: `<label>:<reason>`. */
  label: string;
  /** Every column the spot reads or writes; the chunk of each must be loaded before anything is read. */
  columns(c: Candidate): Array<[number, number]>;
  /**
   * Judges the spot for a box whose bottom is `y`; undefined when a read hit
   * an unloaded chunk. On success, the cells it will write, collision-checked
   * like the box itself.
   */
  check(view: BlockView, c: Candidate, y: number): { ok: true; box: Box } | { ok: false; reason: string } | undefined;
}

const chunkOf = (v: number): number => Math.floor(v / CHUNK);

export const spotLoaded = (view: BlockView, c: Candidate, spot: ExtraSpot | undefined): boolean =>
  spot === undefined || spot.columns(c).every(([x, z]) => view.isLoaded(chunkOf(x) * CHUNK, chunkOf(z) * CHUNK));

export interface SiteCheckerOptions {
  profiles?: Readonly<Record<string, SiteProfile>>;
  /** Structure type → its extra spot. */
  spots?: Readonly<Record<string, ExtraSpot>>;
  /** Registry records block the site too; the candidate's own id is skipped on a recheck. */
  registry?: Registry;
  log?: (msg: string) => void;
}

type Vert = ProfileResult | { ok: false; reason: "unloaded" };

export class SiteChecker {
  private readonly profiles: Readonly<Record<string, SiteProfile>>;
  private readonly log: (msg: string) => void;
  /** Checks by outcome: `valid`, `pending`, or the reject reason. */
  readonly counts: Record<string, number> = {};

  constructor(
    private readonly views: (dim: DimShort) => BlockView | undefined,
    private readonly salt: () => string,
    private readonly opts: SiteCheckerOptions = {}
  ) {
    this.profiles = opts.profiles ?? PROFILES;
    this.log = opts.log ?? (() => {});
  }

  loaded(c: Candidate): boolean {
    const view = this.views(c.dim);
    return view !== undefined && footprintLoaded(view, c) && spotLoaded(view, c, this.opts.spots?.[c.def.id]);
  }

  /** The full check. Nothing is read from the world before the loaded gate passes. */
  check(c: Candidate, selfId?: string): SiteVerdict {
    const verdict = this.run(c, selfId);
    const key = verdict.kind === "rejected" ? verdict.reason : verdict.kind;
    this.counts[key] = (this.counts[key] ?? 0) + 1;
    if (verdict.kind === "rejected") this.log(`strf site: ${c.id} rot ${c.rot} at ${c.x},${c.z} rejected: ${verdict.reason}`);
    return verdict;
  }

  private run(c: Candidate, selfId: string | undefined): SiteVerdict {
    const view = this.views(c.dim);
    const spot = this.opts.spots?.[c.def.id];
    if (view === undefined || !footprintLoaded(view, c) || !spotLoaded(view, c, spot)) return { kind: "pending" };
    const profile = this.profiles[c.def.id];
    if (profile === undefined) return { kind: "rejected", reason: "no-profile" };

    const v = this.vertical(view, c, profile);
    if (!v.ok) return v.reason === "unloaded" ? { kind: "pending" } : { kind: "rejected", reason: v.reason };

    const boxes: Array<{ prefix: string; origin: Vec3; size: Vec3 }> = [{ prefix: "", origin: [c.x, v.y, c.z], size: c.size }];
    if (spot !== undefined) {
      const s = spot.check(view, c, v.y);
      if (s === undefined) return { kind: "pending" };
      if (!s.ok) return { kind: "rejected", reason: `${spot.label}:${s.reason}` };
      const { min, max } = s.box;
      boxes.push({ prefix: `${spot.label}:`, origin: min, size: [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1] });
    }
    for (const b of boxes) {
      if (this.opts.registry !== undefined) {
        const other = instanceCollision(this.opts.registry, c.dim, b.origin, b.size, selfId ?? c.id);
        if (other !== undefined) return { kind: "rejected", reason: b.prefix + collision("instance") };
      }
      const scan = scanCollision(view, c.dim, collisionBox(b.origin, b.size));
      if (scan.kind === "unloaded") return { kind: "pending" };
      if (scan.kind === "hit") return { kind: "rejected", reason: b.prefix + collision(scan.collision) };
    }
    return { kind: "valid", y: v.y };
  }

  private vertical(view: BlockView, c: Candidate, p: SiteProfile): Vert {
    const [w, h, d] = c.size;
    const unit = (purpose: string): number => rollUnit(this.salt(), c.dim, c.x, c.z, c.def.id, purpose);

    if (p.vertical === "netherFloor") {
      const spec = p.netherFloor;
      if (spec === undefined) return { ok: false, reason: "no-profile" };
      const cols: NetherColumn[] = [];
      const midX = c.x + (w - 1) / 2;
      const midZ = c.z + (d - 1) / 2;
      for (const [x, z] of sampleColumns(c.x, c.z, w, d)) {
        const inner = Math.abs(x - midX) <= (spec.innerShare * w) / 2 && Math.abs(z - midZ) <= (spec.innerShare * d) / 2;
        const col = netherColumn(view, x, z, inner, spec);
        if (col === undefined) return { ok: false, reason: "unloaded" };
        cols.push(col);
      }
      return netherFloor(cols, h, spec);
    }

    const columns = p.dryLand?.centreRing === true ? centreRing(c.x, c.z, w, d) : sampleColumns(c.x, c.z, w, d);
    const samples: SurfaceSample[] = [];
    for (const [x, z] of columns) {
      const s = surfaceSample(view, x, z);
      if (s === undefined) return { ok: false, reason: "unloaded" };
      samples.push(s);
    }
    if (p.dryLand !== undefined) {
      const g = dryLand(samples, p.dryLand);
      if (!g.ok) return g;
    }
    if (p.vertical === "surface") {
      if (p.flat !== undefined) {
        const g = flat(samples, p.flat);
        if (!g.ok) return g;
      }
      return { ok: true, y: surfaceY(samples) };
    }
    if (p.vertical === "altitude") {
      if (p.altitude === undefined) return { ok: false, reason: "no-profile" };
      return altitude(Math.max(...samples.map((s) => s.top)), h, unit("clearance"), view.maxY, p.altitude);
    }
    if (p.depth === undefined) return { ok: false, reason: "no-profile" };
    return depth(h, unit("depth"), view.minY, p.depth);
  }

  statsLine(): string {
    const per = Object.entries(this.counts).map(([k, n]) => `${k}=${n}`).join(" ");
    return `strf site: ${per || "no checks"}`;
  }
}

export const collision = (kind: CollisionKind): string => `collision:${kind}`;

const ID = /^([a-z_]+):([on]):(-?\d+):(-?\d+)$/;

/** The candidate a reserved record came from, rebuilt without re-rolling. */
export function candidateOf(inst: Instance): Candidate {
  const def = ROLL_DEFS.find((d) => d.id === (inst.def as StructureId));
  if (def === undefined) throw new Error(`strf site: no roll def "${inst.def}" for ${inst.id}`);
  const m = ID.exec(inst.id);
  return {
    id: inst.id,
    def,
    dim: inst.dim,
    cx: m === null ? Math.floor(inst.origin[0] / CHUNK) : Number(m[3]),
    cz: m === null ? Math.floor(inst.origin[2] / CHUNK) : Number(m[4]),
    rot: inst.rot,
    size: [...inst.size],
    x: inst.origin[0],
    z: inst.origin[2],
  };
}

export type OccupyResult = { kind: "placed" } | { kind: "pending" } | { kind: "rejected"; reason: string } | { kind: "skipped" };

/**
 * Sits between discovery and placement. `site` is the Site handed to
 * Discovery; `occupy` runs the place step of a reserved instance.
 */
export class SiteGate {
  readonly held = new PendingSites();

  /** `clock` is the number of finished job slices (Discovery.stats.slices). */
  constructor(
    private readonly checker: SiteChecker,
    private readonly registry: Registry,
    private readonly clock: () => number,
    private readonly log: (msg: string) => void = () => {}
  ) {}

  readonly site: Site = (cand) => {
    const v = this.checker.check(cand);
    if (v.kind === "pending") this.held.hold({ cand, slice: this.clock(), state: "unloaded" });
    else if (v.kind === "valid") this.held.hold({ cand, slice: this.clock(), state: "validated", y: v.y });
    else this.held.release(cand.id);
    return v;
  };

  /**
   * A site checked in the current slice goes straight to the loaded gate;
   * anything older, or unknown after a restart, is checked again in full,
   * because a player may have built there in between (L0-strf-r007).
   * A failed recheck marks the record failed and writes nothing.
   */
  occupy(inst: Instance, write: (inst: Instance) => void): OccupyResult {
    if (inst.state !== "planned") return { kind: "skipped" };
    const cand = candidateOf(inst);
    const held = this.held.get(inst.id);
    const fresh = held?.state === "validated" && held.slice === this.clock() && held.y === inst.origin[1];

    if (fresh) {
      if (!this.checker.loaded(cand)) {
        this.held.hold({ cand, slice: this.clock(), state: "unloaded" });
        return { kind: "pending" };
      }
    } else {
      const v = this.checker.check(cand, inst.id);
      if (v.kind === "pending") {
        this.held.hold({ cand, slice: this.clock(), state: "unloaded" });
        return { kind: "pending" };
      }
      const reason = v.kind === "rejected" ? v.reason : v.y !== inst.origin[1] ? "site-changed" : undefined;
      if (reason !== undefined) {
        this.held.release(inst.id);
        this.registry.fail(inst, reason);
        this.log(`strf site: ${inst.id} cancelled on recheck: ${reason}`);
        return { kind: "rejected", reason };
      }
    }
    this.registry.runStep(inst, "place", (current) => write(current));
    this.held.release(inst.id);
    return { kind: "placed" };
  }
}

// ------------------------------------------------------------ engine adapter

export interface EngineApi {
  BlockVolume: typeof BlockVolume;
  BlockTypes: typeof BlockTypes;
}

/** `containsBlock`'s per-call volume is capped like `fillBlocks` (probe Q10); larger boxes go in Y slabs. */
const QUERY_CELLS = 32768;

/** getTopmostBlock, containsBlock and setBlockType throw in an unloaded chunk (probe Q9); getBlock returns undefined. */
const isUnloadedError = (e: unknown): boolean =>
  e instanceof Error && /unloaded/i.test(`${e.constructor?.name ?? ""} ${e.name} ${e.message}`);

export function dimensionView(dim: Dimension, api: EngineApi): BlockView {
  const { min, max } = dim.heightRange;
  const known = new Map<string, boolean>();
  const knownTypes = (types: readonly string[]): string[] =>
    types.filter((t) => {
      let k = known.get(t);
      if (k === undefined) {
        k = api.BlockTypes.get(t) !== undefined;
        known.set(t, k);
      }
      return k;
    });

  return {
    minY: min,
    maxY: max,
    isLoaded: (x, z) => dim.isChunkLoaded({ x, y: min, z }),
    // getTopmostBlock skips liquids: under a pond it returns the pond's bed
    // (measured on BDS 1.26.51.1). The liquid column above is climbed here.
    topmost(x, z) {
      let top: { y: number; typeId: string };
      try {
        const b = dim.getTopmostBlock({ x, z });
        top = b === undefined ? { y: min - 1, typeId: AIR } : { y: b.location.y, typeId: b.typeId };
      } catch (e) {
        if (isUnloadedError(e)) return undefined;
        throw e;
      }
      for (let y = top.y + 1; y < max; y++) {
        const t = dim.getBlock({ x, y, z })?.typeId;
        if (t === undefined) return undefined;
        if (!isLiquid(t)) break;
        top = { y, typeId: t };
      }
      return top;
    },
    typeAt(x, y, z) {
      if (y < min || y >= max) return AIR;
      return dim.getBlock({ x, y, z })?.typeId;
    },
    contains(lo, hi, types) {
      const ids = knownTypes(types);
      if (ids.length === 0) return false;
      const y0 = Math.max(lo[1], min);
      const y1 = Math.min(hi[1], max - 1);
      const area = (hi[0] - lo[0] + 1) * (hi[2] - lo[2] + 1);
      const slab = Math.max(1, Math.floor(QUERY_CELLS / area));
      try {
        for (let y = y0; y <= y1; y += slab) {
          const vol = new api.BlockVolume({ x: lo[0], y, z: lo[2] }, { x: hi[0], y: Math.min(y1, y + slab - 1), z: hi[2] });
          if (dim.containsBlock(vol, { includeTypes: ids }, false)) return true;
        }
      } catch (e) {
        if (isUnloadedError(e)) return undefined;
        throw e;
      }
      return false;
    },
  };
}
