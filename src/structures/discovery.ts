// Chunk discovery and the roll worker (L0-strf-p001, L0-strf-p005). Stable
// 2.10.0 has no chunk-generation event (strf-p006 Q9), so chunks are found
// around players and evaluated by one job that yields on a time budget.
// Engine objects come in through DiscoveryHost; node tests run this as is.

import { type RollDef, DISCOVER_INTERVAL_TICKS, QUEUE_LIMIT, ROLL_DEFS, R_DISCOVER, SLICE_BUDGET_MS, dimShort } from "./config";
import type { DimShort, Registry } from "./registry";
import { type Candidate, buildCandidate, rollHit } from "./roll";

/**
 * Validation of one candidate site (L0-strf-p002). `pending` means part of the
 * footprint is not loaded: the same origin and rotation are retried later.
 */
export type SiteVerdict = { kind: "valid"; y: number } | { kind: "rejected"; reason: string } | { kind: "pending" };
export type Site = (candidate: Candidate) => SiteVerdict;

export type RollOutcome = "miss" | "planned" | "existing" | "rejected" | "collision" | "pending";

export interface DefResult {
  def: string;
  outcome: RollOutcome;
  reason?: string;
}

export interface ChunkResult {
  dim: DimShort;
  cx: number;
  cz: number;
  results: DefResult[];
  evaluated: boolean;
}

export interface PlayerPos {
  dimensionId: string;
  x: number;
  z: number;
}

export interface DiscoveryStats {
  chunks: number;
  slices: number;
  maxSliceMs: number;
  totalMs: number;
  dropped: number;
  /** Chunks skipped because `hold` covered them; they stay unevaluated and come back later. */
  held: number;
  outcomes: Record<string, Record<RollOutcome, number>>;
}

export interface DiscoveryOptions {
  defs?: readonly RollDef[];
  /** A def this returns false for is not rolled at all: no outcome, no record. */
  enabled?: (def: string) => boolean;
  radius?: number;
  budgetMs?: number;
  now?: () => number;
  log?: (msg: string) => void;
}

const CHUNK = 16;
const chunkKey = (dim: DimShort, cx: number, cz: number): string => `${dim}:${cx}:${cz}`;
const emptyCounts = (): Record<RollOutcome, number> => ({ miss: 0, planned: 0, existing: 0, rejected: 0, collision: 0, pending: 0 });

/** Chunks within `radius` (Chebyshev) of the centre, nearest ring first. */
export function chunksAround(cx: number, cz: number, radius: number): Array<[number, number]> {
  const out: Array<[number, number]> = [[cx, cz]];
  for (let r = 1; r <= radius; r++) {
    for (let d = -r; d <= r; d++) {
      out.push([cx + d, cz - r], [cx + d, cz + r]);
      if (d !== -r && d !== r) out.push([cx - r, cz + d], [cx + r, cz + d]);
    }
  }
  return out;
}

export class Discovery {
  private readonly defs: readonly RollDef[];
  private readonly enabled: (def: string) => boolean;
  private readonly radius: number;
  private readonly budgetMs: number;
  private readonly now: () => number;
  private readonly log: (msg: string) => void;
  private readonly queue: Array<[DimShort, number, number]> = [];
  private readonly queued = new Set<string>();
  /** Chunk → defs still waiting for their footprint to load; only those are retried. */
  private readonly pending = new Map<string, Set<string>>();
  private running = false;
  readonly stats: DiscoveryStats;
  /**
   * Chunks this returns true for are neither queued nor rolled, and are not
   * marked evaluated: the spawn Windmill search holds its area this way
   * until it is finished (L0-wind-r013).
   */
  hold: ((dim: DimShort, cx: number, cz: number) => boolean) | undefined;

  constructor(
    private readonly registry: Registry,
    private readonly site: Site,
    opts: DiscoveryOptions = {}
  ) {
    this.defs = opts.defs ?? ROLL_DEFS;
    this.enabled = opts.enabled ?? (() => true);
    this.radius = opts.radius ?? R_DISCOVER;
    this.budgetMs = opts.budgetMs ?? SLICE_BUDGET_MS;
    this.now = opts.now ?? Date.now;
    this.log = opts.log ?? (() => {});
    this.stats = { chunks: 0, slices: 0, maxSliceMs: 0, totalMs: 0, dropped: 0, held: 0, outcomes: {} };
    for (const d of this.defs) this.stats.outcomes[d.id] = emptyCounts();
  }

  get queueLength(): number {
    return this.queue.length;
  }

  get isRunning(): boolean {
    return this.running;
  }

  pendingDefs(dim: DimShort, cx: number, cz: number): string[] {
    return [...(this.pending.get(chunkKey(dim, cx, cz)) ?? [])];
  }

  /** Map lookups only, no block reads (L0-strf-p005). */
  discover(players: Iterable<PlayerPos>): void {
    for (const p of players) {
      const dim = dimShort(p.dimensionId);
      if (dim === undefined || !this.defs.some((d) => d.dim === dim)) continue;
      for (const [cx, cz] of chunksAround(Math.floor(p.x / CHUNK), Math.floor(p.z / CHUNK), this.radius)) {
        this.enqueue(dim, cx, cz);
      }
    }
  }

  enqueue(dim: DimShort, cx: number, cz: number): void {
    const key = chunkKey(dim, cx, cz);
    if (this.queued.has(key) || this.registry.isEvaluated(dim, cx, cz)) return;
    if (this.hold?.(dim, cx, cz) === true) {
      this.stats.held++;
      return;
    }
    if (this.queue.length >= QUEUE_LIMIT) {
      const [od, ox, oz] = this.queue.shift() as [DimShort, number, number];
      this.queued.delete(chunkKey(od, ox, oz));
      this.stats.dropped++;
    }
    this.queue.push([dim, cx, cz]);
    this.queued.add(key);
  }

  /**
   * Roll every def of the dimension on one chunk, in table order. The chunk is
   * marked evaluated only when no candidate on it is pending.
   */
  evaluateChunk(dim: DimShort, cx: number, cz: number): ChunkResult {
    const key = chunkKey(dim, cx, cz);
    const retry = this.pending.get(key);
    this.pending.delete(key);
    this.registry.resolvePending(dim, cx, cz);
    const salt = this.registry.salt();
    const waiting = new Set<string>();
    const results: DefResult[] = [];

    for (const def of this.defs) {
      if (def.dim !== dim || !this.enabled(def.id)) continue;
      // A revisit of a chunk with a pending candidate retries only that one;
      // a candidate already rejected here is never rolled again.
      if (retry !== undefined && !retry.has(def.id)) continue;
      // Behind a pending candidate a later def waits too: resolving it first
      // would let it claim the spot ahead of the higher-priority one.
      const res: DefResult =
        waiting.size > 0 && rollHit(salt, dim, cx, cz, def)
          ? { def: def.id, outcome: "pending", reason: `behind ${[...waiting].join(",")}` }
          : this.rollDef(salt, dim, cx, cz, def);
      if (res.outcome === "pending") waiting.add(def.id);
      this.stats.outcomes[def.id][res.outcome]++;
      results.push(res);
    }

    if (waiting.size > 0) {
      this.pending.set(key, waiting);
      this.registry.deferCandidate(dim, cx, cz);
    }
    const evaluated = this.registry.markEvaluated(dim, cx, cz);
    this.stats.chunks++;
    return { dim, cx, cz, results, evaluated };
  }

  private rollDef(salt: string, dim: DimShort, cx: number, cz: number, def: RollDef): DefResult {
    if (!rollHit(salt, dim, cx, cz, def)) return { def: def.id, outcome: "miss" };
    const cand = buildCandidate(salt, dim, cx, cz, def);
    if (this.registry.get(dim, [cand.x, 0, cand.z], cand.id) !== undefined) return { def: def.id, outcome: "existing" };
    const verdict = this.site(cand);
    if (verdict.kind === "pending") return { def: def.id, outcome: "pending" };
    if (verdict.kind === "rejected") return { def: def.id, outcome: "rejected", reason: verdict.reason };
    const planned = this.registry.plan({
      def: def.id,
      dim,
      origin: [cand.x, verdict.y, cand.z],
      rot: cand.rot,
      size: cand.size,
      id: cand.id,
    });
    if (!planned.ok) return { def: def.id, outcome: "collision", reason: planned.blockedBy.id };
    return { def: def.id, outcome: planned.created ? "planned" : "existing" };
  }

  /**
   * The worker body for `system.runJob`. It yields once a slice has run
   * `budgetMs` and ends when the queue drains, so it is not a permanent loop.
   */
  *job(): Generator<void, void, void> {
    this.running = true;
    try {
      let start = this.now();
      while (this.queue.length > 0) {
        const [dim, cx, cz] = this.queue.shift() as [DimShort, number, number];
        this.queued.delete(chunkKey(dim, cx, cz));
        try {
          // Queued before the hold began: dropped unevaluated, rediscovered later.
          if (this.hold?.(dim, cx, cz) === true) this.stats.held++;
          else this.evaluateChunk(dim, cx, cz);
        } catch (e) {
          // Every later chunk would throw the same (lost salt, newer schema);
          // drop the queue, discovery brings the chunks back.
          this.log(`strf discovery: chunk ${dim} ${cx},${cz} aborted the job: ${String(e)}`);
          this.queue.length = 0;
          this.queued.clear();
        }
        const spent = this.now() - start;
        if (spent >= this.budgetMs && this.queue.length > 0) {
          this.endSlice(spent);
          yield;
          start = this.now();
        }
      }
      this.endSlice(this.now() - start);
    } finally {
      this.running = false;
    }
  }

  private endSlice(ms: number): void {
    this.stats.slices++;
    this.stats.totalMs += ms;
    this.stats.maxSliceMs = Math.max(this.stats.maxSliceMs, ms);
  }

  /** Start the worker unless it runs already or there is nothing to do. */
  pump(runJob: (job: Generator<void, void, void>) => unknown): void {
    if (this.running || this.queue.length === 0) return;
    this.running = true;
    try {
      runJob(this.job());
    } catch (e) {
      this.running = false;
      throw e;
    }
  }

  statsLine(): string {
    const s = this.stats;
    const per = Object.entries(s.outcomes)
      .map(([def, c]) => `${def}:${Object.entries(c).filter(([, n]) => n > 0).map(([k, n]) => `${k}=${n}`).join("/") || "-"}`)
      .join(" ");
    return `strf discovery: chunks=${s.chunks} slices=${s.slices} max-slice-ms=${s.maxSliceMs} total-ms=${s.totalMs} dropped=${s.dropped} held=${s.held} ${per}`;
  }
}

/** The slice of `system` and `world` discovery drives; both satisfy it through a thin adapter. */
export interface DiscoveryHost {
  players(): Iterable<PlayerPos>;
  runInterval(callback: () => void, ticks: number): number;
  runJob(job: Generator<void, void, void>): number;
}

/** The one permanent loop `strf` owns: discover every 20 ticks, pump the worker. */
export function startDiscovery(discovery: Discovery, host: DiscoveryHost): number {
  return host.runInterval(() => {
    discovery.discover(host.players());
    discovery.pump((job) => host.runJob(job));
  }, DISCOVER_INTERVAL_TICKS);
}
