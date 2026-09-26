// Structure instance registry: the only source of truth for "this structure
// exists / is initialised" (L0-strf-r008). Region-sharded world dynamic
// properties, format per L0-strf-e002. Records are never deleted: there is
// deliberately no API for it.

import { ChunkBitset, regionOf } from "./bitset";
import {
  type InitState,
  type InitStep,
  STEP_FROM,
  STEP_TO,
  type StateCode,
  canFail,
  canRun,
  decodeState,
  encodeState,
} from "./state";
import { type KeyValueStore, readLong, writeLong } from "./store";


export type DimShort = "o" | "n";
export type Rotation = 0 | 1 | 2 | 3;
export type Vec3 = [number, number, number];

/** Stored form; field names are one letter because every shard is JSON. */
export interface InstanceRecord {
  id: string;
  d: string;
  o: Vec3;
  r: Rotation;
  /** Rotated bounding-box size; origin `o` is its min corner. */
  b: Vec3;
  s: StateCode;
  x?: Record<string, unknown>;
}

interface RegionShard {
  v: 1;
  ev: string;
  i: InstanceRecord[];
}

export interface Instance {
  id: string;
  def: string;
  dim: DimShort;
  origin: Vec3;
  rot: Rotation;
  size: Vec3;
  state: InitState;
  extras: Readonly<Record<string, unknown>>;
}

export interface PlanInput {
  def: string;
  dim: DimShort;
  origin: Vec3;
  rot: Rotation;
  size: Vec3;
  /** Defaults to `${def}:${dim}:${cx}:${cz}` of the origin chunk. */
  id?: string;
}

export type PlanResult =
  | { ok: true; created: boolean; instance: Instance }
  | { ok: false; blockedBy: Instance };

export type StepResult = "ran" | "skipped";

export interface RegistryStats {
  shards: number;
  records: number;
  evaluatedChunks: number;
  shardChars: number;
  largestShardChars: number;
  largestRecordChars: number;
  storeBytes: number | undefined;
}

export const KEY_PREFIX = "andrew:st:";
export const SALT_KEY = `${KEY_PREFIX}salt`;
export const VERSION_KEY = `${KEY_PREFIX}ver`;
export const SCHEMA_VERSION = 1;

/**
 * Largest footprint side a record may declare. Collision reads every shard
 * within this distance of a candidate, because a record lives in the shard of
 * its origin chunk and can reach into the next region.
 */
export const MAX_FOOTPRINT_BLOCKS = 64;

const CHUNK = 16;
const CACHE_SHARDS = 64;
const SHARD_KEY = /^andrew:st:([on]):(-?\d+):(-?\d+)$/;

const chunkOf = (block: number): number => Math.floor(block / CHUNK);
const shardKey = (dim: DimShort, rx: number, rz: number): string => `${KEY_PREFIX}${dim}:${rx}:${rz}`;
const pendingKey = (dim: DimShort, cx: number, cz: number): string => `${dim}:${cx}:${cz}`;
const emptyShard = (): RegionShard => ({ v: 1, ev: "", i: [] });

function view(dim: DimShort, rec: InstanceRecord): Instance {
  return {
    id: rec.id,
    def: rec.d,
    dim,
    origin: [...rec.o],
    rot: rec.r,
    size: [...rec.b],
    state: decodeState(rec.s),
    extras: { ...(rec.x ?? {}) },
  };
}

/** Footprints touch in x/z; y is ignored, a structure over another's plot still blocks it. */
const overlapsXZ = (a: InstanceRecord, o: Vec3, b: Vec3): boolean =>
  a.o[0] < o[0] + b[0] && o[0] < a.o[0] + a.b[0] && a.o[2] < o[2] + b[2] && o[2] < a.o[2] + a.b[2];

export class Registry {
  private readonly cache = new Map<string, RegionShard>();
  private readonly pending = new Set<string>();

  constructor(
    private readonly store: KeyValueStore,
    private readonly log: (msg: string) => void = () => {}
  ) {}

  // ---------------------------------------------------------------- shards

  private load(key: string): RegionShard {
    const hit = this.cache.get(key);
    if (hit !== undefined) {
      this.cache.delete(key);
      this.cache.set(key, hit);
      return hit;
    }
    const raw = readLong(this.store, key);
    const shard = raw === undefined ? emptyShard() : (JSON.parse(raw) as RegionShard);
    if (shard.v !== 1) throw new Error(`strf registry: ${key} has shard version ${String(shard.v)}`);
    this.cache.set(key, shard);
    while (this.cache.size > CACHE_SHARDS) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
    return shard;
  }

  private shardAt(dim: DimShort, cx: number, cz: number): { key: string; shard: RegionShard } {
    const key = shardKey(dim, regionOf(cx), regionOf(cz));
    return { key, shard: this.load(key) };
  }

  /** Synchronous: the state a step leaves behind is durable before the step returns. */
  private save(key: string, shard: RegionShard): void {
    this.assertWritable();
    writeLong(this.store, key, JSON.stringify(shard));
  }

  private assertWritable(): void {
    const raw = this.store.get(VERSION_KEY);
    const ver = raw === undefined ? undefined : Number(raw);
    if (ver !== undefined && ver > SCHEMA_VERSION) {
      throw new Error(`strf registry: schema ${ver} is newer than ${SCHEMA_VERSION}, generation disabled`);
    }
    if (ver === undefined) this.store.set(VERSION_KEY, String(SCHEMA_VERSION));
    // The salt precedes the first shard, so "shards without salt" can only
    // mean a lost salt; salt() refuses that case, and with it the write.
    if (this.store.get(SALT_KEY) === undefined) this.createSalt();
  }

  private locate(inst: Pick<Instance, "id" | "dim" | "origin">): { key: string; shard: RegionShard; rec: InstanceRecord } {
    const { key, shard } = this.shardAt(inst.dim, chunkOf(inst.origin[0]), chunkOf(inst.origin[2]));
    const rec = shard.i.find((r) => r.id === inst.id);
    if (rec === undefined) throw new Error(`strf registry: no record ${inst.id} in ${key}`);
    return { key, shard, rec };
  }

  // --------------------------------------------------------------- records

  /** Every record whose footprint overlaps the given box in x/z. */
  recordsOverlapping(dim: DimShort, origin: Vec3, size: Vec3): Instance[] {
    const reach = MAX_FOOTPRINT_BLOCKS;
    const rx0 = regionOf(chunkOf(origin[0] - reach));
    const rx1 = regionOf(chunkOf(origin[0] + size[0] + reach));
    const rz0 = regionOf(chunkOf(origin[2] - reach));
    const rz1 = regionOf(chunkOf(origin[2] + size[2] + reach));
    const out: Instance[] = [];
    for (let rx = rx0; rx <= rx1; rx++) {
      for (let rz = rz0; rz <= rz1; rz++) {
        for (const rec of this.load(shardKey(dim, rx, rz)).i) {
          if (overlapsXZ(rec, origin, size)) out.push(view(dim, rec));
        }
      }
    }
    return out;
  }

  get(dim: DimShort, origin: Vec3, id: string): Instance | undefined {
    const { shard } = this.shardAt(dim, chunkOf(origin[0]), chunkOf(origin[2]));
    const rec = shard.i.find((r) => r.id === id);
    return rec === undefined ? undefined : view(dim, rec);
  }

  /**
   * Reserve an instance in state `planned`, before the first world mutation.
   * The same id again returns the existing record untouched; any other record
   * on the footprint blocks the candidate, whatever its state and whether or
   * not the structure still stands.
   */
  plan(input: PlanInput): PlanResult {
    if (input.size.some((n) => n <= 0 || n > MAX_FOOTPRINT_BLOCKS)) {
      throw new Error(`strf registry: footprint ${input.size.join("x")} outside 1..${MAX_FOOTPRINT_BLOCKS}`);
    }
    const cx = chunkOf(input.origin[0]);
    const cz = chunkOf(input.origin[2]);
    const id = input.id ?? `${input.def}:${input.dim}:${cx}:${cz}`;
    const same = this.get(input.dim, input.origin, id);
    if (same !== undefined) return { ok: true, created: false, instance: same };
    const other = this.recordsOverlapping(input.dim, input.origin, input.size).find((r) => r.id !== id);
    if (other !== undefined) return { ok: false, blockedBy: other };

    const rec: InstanceRecord = {
      id,
      d: input.def,
      o: [...input.origin],
      r: input.rot,
      b: [...input.size],
      s: encodeState("planned"),
    };
    const { key, shard } = this.shardAt(input.dim, cx, cz);
    shard.i.push(rec);
    this.save(key, shard);
    this.log(`strf registry: planned ${id} (${JSON.stringify(rec).length} chars)`);
    return { ok: true, created: true, instance: view(input.dim, rec) };
  }

  /**
   * Run one init step: `work` runs only while the record sits in the step's
   * predecessor state, and the successor state is written right after it.
   * A throw from `work` leaves the state where it was.
   */
  runStep(inst: Pick<Instance, "id" | "dim" | "origin">, step: InitStep, work: (current: Instance) => void): StepResult {
    const before = this.locate(inst);
    const state = decodeState(before.rec.s);
    if (!canRun(state, step)) {
      this.log(`strf registry: ${inst.id} step ${step} skipped, state ${state} (needs ${STEP_FROM[step]})`);
      return "skipped";
    }
    work(view(inst.dim, before.rec));
    // `work` may have written extras through this registry; re-read the record.
    const { key, shard, rec } = this.locate(inst);
    rec.s = encodeState(STEP_TO[step]);
    this.save(key, shard);
    return "ran";
  }

  /** Terminal `failed`; refused once guards exist, since `guarded` is never reset. */
  fail(inst: Pick<Instance, "id" | "dim" | "origin">, reason: string): boolean {
    const { key, shard, rec } = this.locate(inst);
    if (!canFail(decodeState(rec.s))) return false;
    rec.s = encodeState("failed");
    rec.x = { ...(rec.x ?? {}), why: reason };
    this.save(key, shard);
    return true;
  }

  setExtra(inst: Pick<Instance, "id" | "dim" | "origin">, name: string, value: unknown): void {
    const { key, shard, rec } = this.locate(inst);
    rec.x = { ...(rec.x ?? {}), [name]: value };
    this.save(key, shard);
  }

  // ------------------------------------------------------------ evaluated bits

  isEvaluated(dim: DimShort, cx: number, cz: number): boolean {
    return ChunkBitset.decode(this.shardAt(dim, cx, cz).shard.ev).has(cx, cz);
  }

  /** A chunk with a deferred candidate stays unevaluated until `resolvePending`. */
  deferCandidate(dim: DimShort, cx: number, cz: number): void {
    this.pending.add(pendingKey(dim, cx, cz));
  }

  resolvePending(dim: DimShort, cx: number, cz: number): void {
    this.pending.delete(pendingKey(dim, cx, cz));
  }

  /** Returns false, writing nothing, while the chunk has a pending candidate. */
  markEvaluated(dim: DimShort, cx: number, cz: number): boolean {
    if (this.pending.has(pendingKey(dim, cx, cz))) return false;
    const { key, shard } = this.shardAt(dim, cx, cz);
    const bits = ChunkBitset.decode(shard.ev);
    if (bits.has(cx, cz)) return true;
    bits.set(cx, cz);
    shard.ev = bits.encode();
    this.save(key, shard);
    return true;
  }

  // ------------------------------------------------------------------ salt

  /**
   * The world salt, created once and never regenerated. Missing salt next to
   * existing shards means the world lost it; re-salting would move every roll,
   * so this throws instead.
   */
  salt(): string {
    STRF_TEST_HOOK: if (hook?.salt !== undefined) return hook.salt;
    return this.store.get(SALT_KEY) ?? this.createSalt();
  }

  private createSalt(): string {
    if (this.shardKeys().length > 0) {
      throw new Error("strf registry: salt is missing while shards exist, refusing to re-salt");
    }
    const fresh = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    this.store.set(SALT_KEY, fresh);
    return fresh;
  }

  // ----------------------------------------------------------- diagnostics

  shardKeys(): string[] {
    return this.store.keys().filter((k) => SHARD_KEY.test(k));
  }

  /** Every record in the store, read past the cache. */
  allInstances(): Instance[] {
    const out: Instance[] = [];
    for (const key of this.shardKeys().sort()) {
      const dim = SHARD_KEY.exec(key)?.[1] as DimShort;
      const raw = readLong(this.store, key);
      if (raw === undefined) continue;
      for (const rec of (JSON.parse(raw) as RegionShard).i) out.push(view(dim, rec));
    }
    return out;
  }

  stats(): RegistryStats {
    const s: RegistryStats = {
      shards: 0,
      records: 0,
      evaluatedChunks: 0,
      shardChars: 0,
      largestShardChars: 0,
      largestRecordChars: 0,
      storeBytes: this.store.totalBytes(),
    };
    for (const key of this.shardKeys()) {
      const raw = readLong(this.store, key);
      if (raw === undefined) continue;
      const shard = JSON.parse(raw) as RegionShard;
      s.shards++;
      s.records += shard.i.length;
      s.evaluatedChunks += ChunkBitset.decode(shard.ev).count();
      s.shardChars += raw.length;
      s.largestShardChars = Math.max(s.largestShardChars, raw.length);
      for (const rec of shard.i) s.largestRecordChars = Math.max(s.largestRecordChars, JSON.stringify(rec).length);
    }
    return s;
  }

  /** Worded without "failed"/"error": bds:check reads those as script failures. */
  statsLine(): string {
    const s = this.stats();
    return (
      `strf registry: shards=${s.shards} records=${s.records} evaluated=${s.evaluatedChunks} ` +
      `chars=${s.shardChars} largest-shard=${s.largestShardChars} largest-record=${s.largestRecordChars} ` +
      `store-bytes=${s.storeBytes ?? "not measured"}`
    );
  }
}

// ------------------------------------------------------------- test hook
//
// Every hook body sits in a `STRF_TEST_HOOK:` labelled statement. The release
// bundle is built with esbuild `--drop-labels=STRF_TEST_HOOK`, which deletes
// those statements outright; the selftest and gametest bundles keep them.

interface TestHook {
  salt?: string;
  outcomes: Map<string, boolean>;
}

let hook: TestHook | undefined;

const outcomeKey = (def: string, dim: DimShort, cx: number, cz: number): string => `${def}:${dim}:${cx}:${cz}`;

/**
 * Override the world salt and force per-chunk roll outcomes, for GameTests and
 * operator commands (L0-strf-d001). Throws in the release build.
 */
export function installTestHook(opts: { salt?: string; outcomes?: ReadonlyArray<[string, DimShort, number, number, boolean]> }): void {
  STRF_TEST_HOOK: {
    const armed: TestHook = { salt: opts.salt, outcomes: new Map() };
    for (const [def, dim, cx, cz, hit] of opts.outcomes ?? []) armed.outcomes.set(outcomeKey(def, dim, cx, cz), hit);
    hook = armed;
    console.warn(`[andrew] strf-test-hook armed: salt=${opts.salt ?? "world"} outcomes=${armed.outcomes.size}`);
    return;
  }
  throw new Error("strf: test hook is not compiled into this build");
}

export function clearTestHook(): void {
  hook = undefined;
}

/** The forced roll outcome for this chunk and def, or undefined when the roll decides. */
export function forcedOutcome(def: string, dim: DimShort, cx: number, cz: number): boolean | undefined {
  STRF_TEST_HOOK: return hook?.outcomes.get(outcomeKey(def, dim, cx, cz));
  return undefined;
}

export function testHookCompiled(): boolean {
  STRF_TEST_HOOK: return true;
  return false;
}
