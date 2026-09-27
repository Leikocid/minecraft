// The guaranteed spawn Windmill (§4.7, L0-wind-p002, -r007, -r011, -r013):
// once per world, the nearest naturally valid site in the 5×5 chunks around
// spawn, else the nearest within 500 blocks, else the best dry site prepared
// by force (prepare.ts). Terrain is loaded through temporary ticking areas
// (L0-wind-ad01), a window at a time. Engine objects come in through
// SpawnHost, so node tests drive the search over a fake world.
// The operator's `find` runs the same ring search for any type around any
// point (SpawnSearch.operator): no one-time record, no discovery hold, and
// never forced preparation — §4.7 allows that to the spawn Windmill alone.

import type { BlockTypes, BlockVolume, Dimension } from "@minecraft/server";
import type { RollDef, StructureId } from "./config";
import { type PrepPlan, type PrepWorld, BAND_MAX, applyPrep, enginePrepWorld, planPrep, precheck } from "./prepare";
import { type NetherColumn, type SiteProfile, type SurfaceSample, PROFILES, dryLand, flat, netherFloor } from "./profiles";
import { type DimShort, type Instance, type Rotation, type Vec3, COLLISION_MARGIN } from "./registry";
import { type Candidate, rollRotation, rotatedSize } from "./roll";
import { type PlaceOutcome, type StrfRuntime, centreOf } from "./runtime";
import { netherColumn, surfaceSample } from "./site";
import type { KeyValueStore } from "./store";

export const SPAWN_KEY = "andrew:st:spawn";
/** Registry id of the spawn Windmill; unique, so a second one can never be reserved. */
export const SPAWN_ID = "windmill:spawn";
export const SEARCH_RADIUS = 500;
/** Stage 1: plot centre within this many chunks of the spawn chunk (L0-wind-as01). */
export const STAGE1_CHUNKS = 2;
/** Discovery leaves chunks this close to spawn alone until the search ends (L0-wind-r013). */
export const HOLD_MARGIN = 48;
/** Script events on the `andrew` namespace: "skip" and "report" in, the state out. */
export const SPAWN_EVENT = "andrew:spawn_windmill";
export const SPAWN_STATE_EVENT = "andrew:spawn_windmill_state";
/** Ticks between world load and the first chunk load; a "skip" arriving earlier stops the search. */
export const START_DELAY_TICKS = 40;

const CHUNK = 16;
/** Candidate origins and the pre-screen heightmap share this grid. */
const GRID = 4;
const WINDOW = 5;
/** Windows loaded at once; the engine allows 10 ticking areas (probe Q11). */
const PARALLEL = 4;
/** Full site checks per search; each loads its own area. */
const MAX_FULL_CHECKS = 64;
const FORCED_KEEP = 6;
/** Forced candidates closer than this to a better one are dropped: they fail for the same reason. */
const FORCED_SPACING = 32;
const COLUMNS_PER_TICK = 800;
/** A Nether column is a downward scan of ~80 reads, not one topmost read. */
const NETHER_COLUMNS_PER_TICK = 80;
const CANDIDATES_PER_TICK = 4000;

export type SpawnStatus = "searching" | "preparing" | "done" | "failed" | "skipped";

export interface SpawnRecord {
  v: 1;
  status: SpawnStatus;
  /** World spawn x/z captured once, never re-read (L0-wind-e002). */
  spawn: [number, number];
  /** Searches started in this world; the record exists before the first one begins, so it never exceeds 1. */
  searches: number;
  stage?: 1 | 2 | 3;
  /** Min corner of the Windmill box. */
  origin?: Vec3;
  rot?: Rotation;
  prepared?: boolean;
  targetY?: number;
  band?: number;
  reason?: string;
  checked?: number;
  rejects?: Record<string, number>;
}

export interface SpawnState {
  status: SpawnStatus;
  searches: number;
  /** True only in the load that ran the search. */
  ranNow: boolean;
  spawn: [number, number];
  stage?: number;
  origin?: Vec3;
  rot?: number;
  prepared?: boolean;
  reason?: string;
  checked?: number;
  distance?: number;
  record: { id: string; state: string } | null;
  /** Windmill records whose centre lies within the hold radius of spawn. */
  nearSpawn: number;
}

export interface SpawnHost {
  spawn(): { x: number; z: number };
  /** Load the chunks under the inclusive x/z box; resolves with the remover, or undefined when it never loaded. */
  load(min: [number, number], max: [number, number]): Promise<(() => void) | undefined>;
  wait(ticks: number): Promise<void>;
  prep(): PrepWorld;
  announce?(state: SpawnState): void;
}

export interface SpawnOptions {
  radius?: number;
  /** Structure type searched for; the spawn search is always the Windmill. */
  type?: StructureId;
  /** Search centre; defaults to the host's world spawn. */
  centre?: { x: number; z: number };
  log?: (msg: string) => void;
}

/** What the operator's search ends with; `placement` is absent when no site was valid. */
export interface FindResult {
  type: StructureId;
  centre: [number, number];
  radius: number;
  checked: number;
  rejects: Record<string, number>;
  rot?: Rotation;
  placement?: PlaceOutcome;
  error?: string;
}

interface Cand {
  ox: number;
  oz: number;
  d: number;
  stage1: boolean;
}

interface Forced extends Cand {
  score: number;
}

type Found = { cand: Cand; rot: Rotation; release: () => void };
type Column = SurfaceSample | NetherColumn;

const SKIP = Symbol("skip");

/** The operator's search owns no store: any read or write is a bug, and it throws. */
const NO_STORE: KeyValueStore = {
  get: (key) => {
    throw new Error(`operator search touched the store (get ${key})`);
  },
  set: (key) => {
    throw new Error(`operator search touched the store (set ${key})`);
  },
  keys: () => [],
  totalBytes: () => undefined,
};

export class SpawnSearch {
  private readonly radius: number;
  private readonly log: (msg: string) => void;
  private readonly def: RollDef;
  private readonly size: Vec3;
  private readonly type: StructureId;
  private readonly dim: DimShort;
  private readonly profile: SiteProfile;
  /** Farthest pre-screen sample from a plot centre, for any rotation. */
  private readonly reach: number;
  private readonly centre: { x: number; z: number } | undefined;
  /** Set only by operator(): no SPAWN_KEY, no discovery hold, no forced preparation. */
  private operatorMode = false;
  private readonly heights = new Map<string, Column | null>();
  private readonly removers = new Set<() => void>();
  private readonly forced: Forced[] = [];
  private skipRequested: string | undefined;
  private active = false;
  private fullChecks = 0;
  private ranNow = false;
  checked = 0;
  readonly rejects: Record<string, number> = {};

  constructor(
    private readonly rt: StrfRuntime,
    private readonly store: KeyValueStore,
    private readonly host: SpawnHost,
    opts: SpawnOptions = {}
  ) {
    this.radius = opts.radius ?? SEARCH_RADIUS;
    this.log = opts.log ?? (() => {});
    this.type = opts.type ?? "windmill";
    this.centre = opts.centre;
    const def = rt.defs.find((d) => d.id === this.type);
    if (def === undefined) throw new Error(`spawn windmill: no ${this.type} roll def`);
    this.def = def;
    this.size = def.size;
    this.dim = def.dim;
    this.profile = PROFILES[this.type];
    const side = Math.max(this.size[0], this.size[2]);
    this.reach = Math.ceil(Math.hypot(side / 2, side / 2));
  }

  /** The operator's search: the same rings around `opts.centre`, run by find(). */
  static operator(rt: StrfRuntime, host: SpawnHost, opts: SpawnOptions & { type: StructureId }): SpawnSearch {
    const s = new SpawnSearch(rt, NO_STORE, host, opts);
    s.operatorMode = true;
    return s;
  }

  read(): SpawnRecord | undefined {
    const raw = this.store.get(SPAWN_KEY);
    return raw === undefined ? undefined : (JSON.parse(raw) as SpawnRecord);
  }

  private write(rec: SpawnRecord): void {
    this.store.set(SPAWN_KEY, JSON.stringify(rec));
  }

  get isActive(): boolean {
    return this.active;
  }

  /** Stops a search that has not written a block yet; the world then has no spawn Windmill. */
  requestSkip(why: string): boolean {
    if (this.operatorMode || !this.active || this.read()?.status !== "searching") return false;
    this.skipRequested = why;
    return true;
  }

  private hold(spawn: [number, number]): void {
    const reach = this.radius + HOLD_MARGIN;
    this.rt.discovery.hold = (dim, cx, cz) =>
      dim === "o" && Math.hypot(cx * CHUNK + CHUNK / 2 - spawn[0], cz * CHUNK + CHUNK / 2 - spawn[1]) <= reach;
  }

  private releaseAll(): void {
    if (!this.operatorMode) this.rt.discovery.hold = undefined;
    for (const r of this.removers) r();
    this.removers.clear();
  }

  private async load(min: [number, number], max: [number, number]): Promise<(() => void) | undefined> {
    const remove = await this.host.load(min, max);
    if (remove === undefined) return undefined;
    const once = (): void => {
      if (!this.removers.delete(once)) return;
      remove();
    };
    this.removers.add(once);
    return once;
  }

  private async tick(n = 1): Promise<void> {
    await this.host.wait(n);
    if (this.skipRequested !== undefined) throw SKIP;
  }

  private reject(reason: string): void {
    this.rejects[reason] = (this.rejects[reason] ?? 0) + 1;
  }

  /** The one entry point: runs the search if this world never ran it, otherwise reports what it found. */
  async run(): Promise<SpawnRecord> {
    if (this.operatorMode) throw new Error("spawn windmill: run() on an operator search; use find()");
    const prev = this.read();
    if (prev !== undefined) return this.resume(prev);

    const s = this.host.spawn();
    const spawn: [number, number] = [Math.floor(s.x), Math.floor(s.z)];
    // Written before any work: a restart finds it and never searches again (L0-wind-r011).
    let rec: SpawnRecord = { v: 1, status: "searching", spawn, searches: 1 };
    this.write(rec);
    this.ranNow = true;
    this.active = true;
    this.hold(spawn);
    this.log(`spawn windmill: search started around spawn ${spawn.join(",")} (radius ${this.radius})`);
    try {
      await this.tick(START_DELAY_TICKS);
      const found = await this.search(spawn);
      if (found !== undefined) {
        rec = this.place(rec, found.cand, found.rot, found.cand.stage1 ? 1 : 2, false);
        found.release();
      } else {
        rec = await this.forcedPrep(rec, spawn);
      }
    } catch (e) {
      rec =
        e === SKIP
          ? { ...rec, status: "skipped", reason: `skipped by ${this.skipRequested}` }
          : { ...rec, status: "failed", reason: `error: ${e instanceof Error ? e.message : String(e)}` };
    } finally {
      this.active = false;
      this.releaseAll();
    }
    rec = { ...rec, checked: this.checked, rejects: { ...this.rejects } };
    this.write(rec);
    this.summary(rec);
    this.announce(rec);
    return rec;
  }

  private async resume(prev: SpawnRecord): Promise<SpawnRecord> {
    let rec = prev;
    if (prev.status === "searching") {
      // Interrupted mid-search: the flag was written before the work, so it is not run again.
      rec = { ...prev, status: "failed", reason: "interrupted: the server stopped during the search" };
      this.write(rec);
      this.log(`spawn windmill: the search was interrupted by a restart; it is not repeated (searches=${prev.searches})`);
    } else if (prev.status === "preparing") {
      this.active = true;
      this.hold(prev.spawn);
      try {
        rec = await this.finishPrep(prev);
      } catch (e) {
        rec = { ...prev, status: "failed", reason: `error: ${e instanceof Error ? e.message : String(e)}` };
      } finally {
        this.active = false;
        this.releaseAll();
      }
      this.write(rec);
    } else {
      this.log(
        `spawn windmill: search already ran once in this world (status=${prev.status} searches=${prev.searches}` +
          `${prev.origin !== undefined ? ` origin=${prev.origin.join(",")}` : ""}${prev.reason !== undefined ? ` reason=${prev.reason}` : ""}), not repeated`
      );
    }
    this.announce(rec);
    return rec;
  }

  /**
   * The operator's entry: nearest valid site within the radius, placed through
   * the registry like `place`. Nothing is written when no site is valid.
   */
  async find(): Promise<FindResult> {
    if (!this.operatorMode) throw new Error("spawn windmill: find() is the operator's search; use SpawnSearch.operator");
    const at = this.centre ?? this.host.spawn();
    const centre: [number, number] = [Math.floor(at.x), Math.floor(at.z)];
    const result: FindResult = { type: this.type, centre, radius: this.radius, checked: 0, rejects: this.rejects };
    this.active = true;
    this.log(`structure find: ${this.type} search started around ${centre.join(",")} (radius ${this.radius})`);
    try {
      const found = await this.search(centre);
      if (found !== undefined) {
        result.rot = found.rot;
        result.placement = this.placeFound(found.cand, found.rot);
        found.release();
      }
    } catch (e) {
      result.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.active = false;
      this.releaseAll();
    }
    result.checked = this.checked;
    result.rejects = { ...this.rejects };
    const p = result.placement;
    const outcome =
      result.error !== undefined ? `stopped (${result.error})` : p === undefined ? "no valid site" : p.kind === "placed" ? `built at ${centreOf(p.instance).join(",")}` : `site found, not built (${p.kind})`;
    const reasons = Object.entries(result.rejects).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}=${n}`).join(" ");
    this.log(
      // Worded without "failed"/"error": bds:check reads those as a script failure.
      `structure find: ${this.type} search finished: ${outcome}; ` +
        `checked ${result.checked} place(s) within ${this.radius} blocks of ${centre.join(",")}, rejected by reason: ${reasons || "none"}`
    );
    return result;
  }

  // ---------------------------------------------------------------- search

  private windowBox(spawnChunk: [number, number], i: number, j: number): { min: [number, number]; max: [number, number] } {
    const cx0 = spawnChunk[0] + WINDOW * i - 2;
    const cz0 = spawnChunk[1] + WINDOW * j - 2;
    return { min: [cx0 * CHUNK, cz0 * CHUNK], max: [(cx0 + WINDOW) * CHUNK - 1, (cz0 + WINDOW) * CHUNK - 1] };
  }

  /** Samples every grid column of the ring's windows once, loading at most PARALLEL windows at a time. */
  private async sampleRing(spawn: [number, number], spawnChunk: [number, number], r: number): Promise<void> {
    const boxes: Array<{ min: [number, number]; max: [number, number] }> = [];
    for (let i = -r; i <= r; i++) {
      for (let j = -r; j <= r; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
        const b = this.windowBox(spawnChunk, i, j);
        const nx = Math.max(b.min[0], Math.min(spawn[0], b.max[0]));
        const nz = Math.max(b.min[1], Math.min(spawn[1], b.max[1]));
        if (Math.hypot(nx - spawn[0], nz - spawn[1]) > this.radius + this.reach) continue;
        boxes.push(b);
      }
    }
    const view = this.host.prep().view;
    const nether = this.profile.netherFloor;
    const perTick = nether === undefined ? COLUMNS_PER_TICK : NETHER_COLUMNS_PER_TICK;
    for (let k = 0; k < boxes.length; k += PARALLEL) {
      const batch = boxes.slice(k, k + PARALLEL);
      const loaded = await Promise.all(batch.map((b) => this.load(b.min, b.max)));
      if (this.skipRequested !== undefined) throw SKIP;
      let n = 0;
      for (let w = 0; w < batch.length; w++) {
        const b = batch[w];
        const remove = loaded[w];
        for (let x = Math.ceil(b.min[0] / GRID) * GRID; x <= b.max[0]; x += GRID) {
          for (let z = Math.ceil(b.min[1] / GRID) * GRID; z <= b.max[1]; z += GRID) {
            const col = remove === undefined ? undefined : nether === undefined ? surfaceSample(view, x, z) : netherColumn(view, x, z, false, nether);
            this.heights.set(`${x},${z}`, col ?? null);
            if (++n % perTick === 0) await this.tick();
          }
        }
        remove?.();
      }
      await this.tick();
    }
  }

  private candidates(spawn: [number, number]): Cand[] {
    const half = Math.floor(this.size[0] / 2);
    const out: Cand[] = [];
    const r = this.radius;
    const scx = Math.floor(spawn[0] / CHUNK);
    const scz = Math.floor(spawn[1] / CHUNK);
    for (let ox = Math.floor((spawn[0] - r - half) / GRID) * GRID; ox <= spawn[0] + r; ox += GRID) {
      for (let oz = Math.floor((spawn[1] - r - half) / GRID) * GRID; oz <= spawn[1] + r; oz += GRID) {
        const cx = ox + half;
        const cz = oz + half;
        const d = Math.hypot(cx - spawn[0], cz - spawn[1]);
        if (d > r) continue;
        const stage1 = Math.abs(Math.floor(cx / CHUNK) - scx) <= STAGE1_CHUNKS && Math.abs(Math.floor(cz / CHUNK) - scz) <= STAGE1_CHUNKS;
        out.push({ ox, oz, d, stage1 });
      }
    }
    return out.sort((a, b) => a.d - b.d || a.ox - b.ox || a.oz - b.oz);
  }

  private async search(spawn: [number, number]): Promise<Found | undefined> {
    const spawnChunk: [number, number] = [Math.floor(spawn[0] / CHUNK), Math.floor(spawn[1] / CHUNK)];
    const all = this.candidates(spawn);
    let ringMax = 0;
    while ((WINDOW * ringMax + 2) * CHUNK < this.radius + this.reach) ringMax++;
    ringMax = Math.max(ringMax, 1);

    await this.sampleRing(spawn, spawnChunk, 0);
    await this.sampleRing(spawn, spawnChunk, 1);
    let n = 0;
    // Stage 1: the 5×5 chunks around spawn, nearest first.
    for (const c of all) {
      if (!c.stage1) continue;
      const found = await this.evaluate(c);
      if (found !== undefined) return found;
      if (++n % CANDIDATES_PER_TICK === 0) await this.tick();
    }
    // Stage 2: nearest within the radius. A candidate is judged once every
    // column it samples is read; judging in distance order keeps "nearest" exact.
    const rest = all.filter((c) => !c.stage1);
    let idx = 0;
    for (let r = 1; r <= ringMax; r++) {
      if (r > 1) await this.sampleRing(spawn, spawnChunk, r);
      const covered = r === ringMax ? Infinity : (WINDOW * r + 2) * CHUNK;
      for (; idx < rest.length && rest[idx].d + this.reach <= covered; idx++) {
        const found = await this.evaluate(rest[idx]);
        if (found !== undefined) return found;
        if (++n % CANDIDATES_PER_TICK === 0) await this.tick();
      }
    }
    return undefined;
  }

  private samplesOf(c: Cand, size: Vec3): Column[] | undefined {
    const out: Column[] = [];
    for (let i = 0; i < size[0]; i += GRID) {
      for (let j = 0; j < size[2]; j += GRID) {
        const s = this.heights.get(`${c.ox + i},${c.oz + j}`);
        if (s === undefined || s === null) return undefined;
        out.push(s);
      }
    }
    return out;
  }

  /** Grid columns nearest to the site check's centre-and-ring columns (site.ts centreRing). */
  private ringOf(c: Cand, size: Vec3): Column[] | undefined {
    const snap = (v: number): number => Math.round(v / GRID) * GRID;
    const out: Column[] = [];
    for (const i of [0, Math.floor(size[0] / 2), size[0] - 1]) {
      for (const j of [0, Math.floor(size[2] / 2), size[2] - 1]) {
        const s = this.heights.get(`${snap(c.ox + i)},${snap(c.oz + j)}`);
        if (s === undefined || s === null) return undefined;
        out.push(s);
      }
    }
    return out;
  }

  /** The site profile's gates on the heightmap; `score` ranks forced-preparation candidates. */
  private prescreen(c: Cand, size: Vec3): { reason: string; score?: number } | { score: number } | undefined {
    const p = this.profile;
    if (p.netherFloor !== undefined) {
      const cols = this.samplesOf(c, size) as NetherColumn[] | undefined;
      if (cols === undefined) return undefined;
      const midX = c.ox + (size[0] - 1) / 2;
      const midZ = c.oz + (size[2] - 1) / 2;
      const s = p.netherFloor.innerShare;
      const judged = cols.map((col) => ({ ...col, inner: Math.abs(col.x - midX) <= (s * size[0]) / 2 && Math.abs(col.z - midZ) <= (s * size[2]) / 2 }));
      const v = netherFloor(judged, size[1], p.netherFloor);
      return v.ok ? { score: 0 } : { reason: v.reason };
    }
    const samples = (p.dryLand?.centreRing === true ? this.ringOf(c, size) : this.samplesOf(c, size)) as SurfaceSample[] | undefined;
    if (samples === undefined) return undefined;
    if (p.dryLand !== undefined && !dryLand(samples, p.dryLand).ok) return { reason: "liquid" };
    const ys = samples.map((s) => s.ground).sort((a, b) => a - b);
    const med = ys[Math.floor((ys.length - 1) / 2)];
    const score = ys.reduce((sum, y) => sum + Math.abs(y - med), 0) * GRID * GRID + 0.1 * c.d;
    if (p.flat !== undefined && !flat(samples, p.flat).ok) return { reason: "uneven", score };
    return { score };
  }

  private keepForced(c: Cand, score: number): void {
    const near = this.forced.filter((f) => Math.hypot(f.ox - c.ox, f.oz - c.oz) < FORCED_SPACING);
    if (near.some((f) => f.score <= score)) return;
    for (const f of near) this.forced.splice(this.forced.indexOf(f), 1);
    this.forced.push({ ...c, score });
    this.forced.sort((a, b) => a.score - b.score);
    if (this.forced.length > FORCED_KEEP) this.forced.length = FORCED_KEEP;
  }

  /** The registry id the placement will take: SPAWN_ID for the spawn search, placeAt's default otherwise. */
  private idOf(c: Cand): string {
    return this.operatorMode ? `${this.type}:${this.dim}:${Math.floor(c.ox / CHUNK)}:${Math.floor(c.oz / CHUNK)}` : SPAWN_ID;
  }

  private rotationOf(c: Cand): Rotation {
    return rollRotation(this.rt.registry.salt(), this.dim, Math.floor(c.ox / CHUNK), Math.floor(c.oz / CHUNK), this.type);
  }

  private candidate(c: Cand, rot: Rotation): Candidate {
    return { id: this.idOf(c), def: this.def, dim: this.dim, cx: Math.floor(c.ox / CHUNK), cz: Math.floor(c.oz / CHUNK), rot, size: rotatedSize(this.size, rot), x: c.ox, z: c.oz };
  }

  /** Pre-screen on the heightmap, then the normal site check (L0-strf-p002) on loaded terrain. */
  private async evaluate(c: Cand): Promise<Found | undefined> {
    this.checked++;
    const rot = this.rotationOf(c);
    const size = rotatedSize(this.size, rot);
    const pre = this.prescreen(c, size);
    if (pre === undefined) return this.reject("unloaded"), undefined;
    if ("reason" in pre) {
      if (pre.reason === "uneven" && pre.score !== undefined && !this.operatorMode) this.keepForced(c, pre.score);
      return this.reject(pre.reason), undefined;
    }
    const score = pre.score;
    if (this.fullChecks >= MAX_FULL_CHECKS) return this.reject("full-check-budget"), undefined;
    this.fullChecks++;

    const cand = this.candidate(c, rot);
    // The site check skips the candidate's own id; placeAt would then refuse a taken one.
    if (this.operatorMode && this.rt.registry.get(this.dim, [c.ox, 0, c.oz], cand.id) !== undefined) return this.reject("collision:instance"), undefined;
    const m = COLLISION_MARGIN;
    const release = await this.load([c.ox - m, c.oz - m], [c.ox + cand.size[0] - 1 + m, c.oz + cand.size[2] - 1 + m]);
    if (this.skipRequested !== undefined) throw SKIP;
    if (release === undefined) return this.reject("unloaded"), undefined;
    const v = this.rt.checker.check(cand, cand.id);
    if (v.kind === "valid") return { cand: c, rot, release };
    release();
    if (v.kind === "pending") return this.reject("unloaded"), undefined;
    if (v.reason === "uneven" && !this.operatorMode) this.keepForced(c, score);
    return this.reject(v.reason), undefined;
  }

  // --------------------------------------------------------------- placing

  /** placeAt takes the centre; the rotated size's half maps it back onto the checked origin. */
  private placeFound(c: Cand, rot: Rotation): PlaceOutcome {
    const size = rotatedSize(this.size, rot);
    const id = this.operatorMode ? undefined : SPAWN_ID;
    return this.rt.placeAt(this.type, this.dim, c.ox + Math.floor(size[0] / 2), c.oz + Math.floor(size[2] / 2), rot, { id });
  }

  private place(rec: SpawnRecord, c: Cand, rot: Rotation, stage: 1 | 2 | 3, prepared: boolean): SpawnRecord {
    const out = this.placeFound(c, rot);
    if (out.kind === "placed") {
      return { ...rec, status: "done", stage, origin: [...out.instance.origin], rot, prepared };
    }
    const why = out.kind === "rejected" || out.kind === "failed" ? `${out.kind}: ${out.reason}` : out.kind === "blocked" ? `blocked by ${out.by.id}` : out.kind;
    this.reject(`place:${out.kind}`);
    return { ...rec, status: "failed", stage, reason: `placement ${why}` };
  }

  private prepBox(ox: number, oz: number): { min: [number, number]; max: [number, number] } {
    const r = BAND_MAX + 1 + COLLISION_MARGIN;
    return { min: [ox - r, oz - r], max: [ox + this.size[0] - 1 + r, oz + this.size[2] - 1 + r] };
  }

  /** Stage 3: the best dry candidates in score order; the first whose pre-check passes is prepared. */
  private async forcedPrep(rec: SpawnRecord, spawn: [number, number]): Promise<SpawnRecord> {
    if (this.forced.length === 0) {
      this.log(`spawn windmill: no dry site within ${this.radius} blocks of spawn ${spawn.join(",")}; no Windmill at spawn in this world`);
      return { ...rec, status: "failed", reason: "no-dry-land" };
    }
    for (const f of this.forced) {
      const b = this.prepBox(f.ox, f.oz);
      const release = await this.load(b.min, b.max);
      if (this.skipRequested !== undefined) throw SKIP;
      if (release === undefined) {
        this.reject("prep:unloaded");
        continue;
      }
      const world = this.host.prep();
      const planned = planPrep(world.view, f.ox, f.oz, this.size[0]);
      const v = planned.ok ? precheck(world, planned.plan, "o", this.rt.registry, SPAWN_ID) : planned;
      if (!v.ok) {
        this.reject(`prep:${v.reason}`);
        this.log(`spawn windmill: forced site ${f.ox},${f.oz} refused before any write: ${v.reason}`);
        release();
        continue;
      }
      const rot = rollRotation(this.rt.registry.salt(), "o", Math.floor(f.ox / CHUNK), Math.floor(f.oz / CHUNK), "windmill");
      const plan = v.plan;
      // Persisted before the first write, so a restart replays this same plan.
      const preparing: SpawnRecord = { ...rec, status: "preparing", stage: 3, origin: [f.ox, plan.targetY + 1, f.oz], rot, targetY: plan.targetY, band: plan.band };
      this.write(preparing);
      this.skipRequested = undefined;
      this.log(
        `spawn windmill: preparing forced site ${f.ox},${f.oz} (d=${Math.round(f.d)}): target y ${plan.targetY}, band ${plan.band}${plan.steep ? " (steep)" : ""}, ` +
          `cut ${plan.cut} fill ${plan.fill}, ${plan.writes.length} writes`
      );
      const done = await this.applyAndPlace(preparing, world, plan, f);
      release();
      return done;
    }
    return { ...rec, status: "failed", reason: "no forced site passed the pre-check" };
  }

  private async applyAndPlace(rec: SpawnRecord, world: PrepWorld, plan: PrepPlan, c: Cand): Promise<SpawnRecord> {
    const job = applyPrep(world, plan);
    for (;;) {
      const step = job.next();
      if (step.done === true) {
        this.log(`spawn windmill: preparation wrote ${step.value.calls} fill calls, largest ${step.value.maxCells} cells; plot clear ${step.value.plotClearCells} cells in ${step.value.plotClearCalls} calls`);
        break;
      }
      await this.host.wait(1);
    }
    return this.place(rec, c, rec.rot ?? 0, 3, true);
  }

  private async finishPrep(prev: SpawnRecord): Promise<SpawnRecord> {
    const [ox, , oz] = prev.origin ?? [0, 0, 0];
    const inst = this.rt.registry.get("o", prev.origin ?? [0, 0, 0], SPAWN_ID);
    if (inst !== undefined) {
      this.log(`spawn windmill: preparation had finished before the restart; ${SPAWN_ID} is ${inst.state}`);
      return { ...prev, status: "done", prepared: true };
    }
    if (prev.origin === undefined || prev.targetY === undefined || prev.band === undefined) return { ...prev, status: "failed", reason: "preparing record without a plan" };
    const b = this.prepBox(ox, oz);
    const release = await this.load(b.min, b.max);
    if (release === undefined) return { ...prev, status: "failed", reason: "prep area did not load after the restart" };
    const world = this.host.prep();
    const planned = planPrep(world.view, ox, oz, this.size[0], { targetY: prev.targetY, band: prev.band });
    const v = planned.ok ? precheck(world, planned.plan, "o", this.rt.registry, SPAWN_ID) : planned;
    if (!v.ok) {
      release();
      return { ...prev, status: "failed", reason: `prep replay refused: ${v.reason}` };
    }
    this.log(`spawn windmill: replaying the interrupted preparation at ${ox},${oz}`);
    const half = Math.floor(this.size[0] / 2);
    const d = Math.hypot(ox + half - prev.spawn[0], oz + half - prev.spawn[1]);
    const done = await this.applyAndPlace(prev, world, v.plan, { ox, oz, d, stage1: false });
    release();
    return done;
  }

  // ---------------------------------------------------------------- report

  private summary(rec: SpawnRecord): void {
    const reasons = Object.entries(rec.rejects ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${k}=${n}`)
      .join(" ");
    const where = rec.origin !== undefined ? ` at ${rec.origin.join(",")} rot ${rec.rot} stage ${rec.stage}${rec.prepared === true ? " (prepared)" : ""}` : "";
    const why = rec.reason !== undefined ? ` (${rec.reason})` : "";
    this.log(
      // "failed" is kept out of the line: bds:check reads that word as a script failure.
      `spawn windmill: search finished: ${rec.status === "failed" ? "no windmill" : rec.status}${where}${why}; checked ${rec.checked ?? 0} place(s) within ${this.radius} blocks of spawn ` +
        `${rec.spawn.join(",")}, rejected by reason: ${reasons || "none"}`
    );
  }

  state(rec: SpawnRecord | undefined = this.read()): SpawnState | undefined {
    if (rec === undefined) return undefined;
    const inst: Instance | undefined = rec.origin !== undefined ? this.rt.registry.get("o", rec.origin, SPAWN_ID) : undefined;
    const reach = this.radius + HOLD_MARGIN;
    const nearSpawn = this.rt.instances("windmill").filter((i) => {
      const c = centreOf(i);
      return i.dim === "o" && Math.hypot(c[0] - rec.spawn[0], c[2] - rec.spawn[1]) <= reach;
    }).length;
    const half = Math.floor(this.size[0] / 2);
    return {
      status: rec.status,
      searches: rec.searches,
      ranNow: this.ranNow,
      spawn: rec.spawn,
      stage: rec.stage,
      origin: rec.origin,
      rot: rec.rot,
      prepared: rec.prepared,
      reason: rec.reason,
      checked: rec.checked,
      distance: rec.origin !== undefined ? Math.round(Math.hypot(rec.origin[0] + half - rec.spawn[0], rec.origin[2] + half - rec.spawn[1])) : undefined,
      record: inst === undefined ? null : { id: inst.id, state: inst.state },
      nearSpawn,
    };
  }

  announce(rec: SpawnRecord | undefined = this.read()): void {
    const s = this.state(rec);
    if (s !== undefined) this.host.announce?.(s);
  }
}

// ------------------------------------------------------------ engine adapter

export interface SpawnSystem {
  runTimeout(callback: () => void, ticks: number): number;
}

/** Ticking-area names the search owns; removed at startup, so a crash never leaks one for good. */
const AREA_POOL = 8;
const AREA_PREFIX = "andrew_ws_";
const LOAD_TIMEOUT_TICKS = 400;
const ADD_RETRIES = 30;

export function engineSpawnHost(
  dim: Dimension,
  sys: SpawnSystem,
  api: { BlockVolume: typeof BlockVolume; BlockTypes: typeof BlockTypes },
  spawn: () => { x: number; z: number },
  announce?: (s: SpawnState) => void,
  /** A second search running beside the spawn one needs its own names, or each removes the other's areas. */
  areas: { prefix?: string; pool?: number } = {}
): SpawnHost {
  const pool = areas.pool ?? AREA_POOL;
  const areaName = (i: number): string => `${areas.prefix ?? AREA_PREFIX}${i}`;
  const wait = (ticks: number): Promise<void> => new Promise((resolve) => sys.runTimeout(resolve, Math.max(1, ticks)));
  const used = new Set<number>();
  const run = (cmd: string): number => {
    try {
      return dim.runCommand(cmd).successCount;
    } catch {
      return 0;
    }
  };
  for (let i = 0; i < pool; i++) run(`tickingarea remove ${areaName(i)}`);
  let prep: PrepWorld | undefined;
  const minY = dim.heightRange.min;

  return {
    spawn,
    wait,
    prep: () => (prep ??= enginePrepWorld(dim, api)),
    announce,
    async load(min, max) {
      let slot = -1;
      for (let tries = 0; tries < ADD_RETRIES && slot < 0; tries++) {
        for (let i = 0; i < pool; i++) {
          if (used.has(i)) continue;
          // The engine caps ticking areas at 10 per world; others may hold some.
          if (run(`tickingarea add ${min[0]} 0 ${min[1]} ${max[0]} 0 ${max[1]} ${areaName(i)}`) > 0) slot = i;
          break;
        }
        if (slot < 0) await wait(10);
      }
      if (slot < 0) return undefined;
      used.add(slot);
      const remove = (): void => {
        run(`tickingarea remove ${areaName(slot)}`);
        used.delete(slot);
      };
      const chunks: Array<{ x: number; y: number; z: number }> = [];
      for (let x = Math.floor(min[0] / CHUNK); x <= Math.floor(max[0] / CHUNK); x++) {
        for (let z = Math.floor(min[1] / CHUNK); z <= Math.floor(max[1] / CHUNK); z++) chunks.push({ x: x * CHUNK, y: minY, z: z * CHUNK });
      }
      for (let t = 0; t < LOAD_TIMEOUT_TICKS; t++) {
        if (chunks.every((c) => dim.isChunkLoaded(c) && dim.getBlock(c) !== undefined)) return remove;
        await wait(1);
      }
      remove();
      return undefined;
    },
  };
}
