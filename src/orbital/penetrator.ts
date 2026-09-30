// The LMB effect (L0-pntr-p001…p003): one explosion sound, then the planned
// column goes top-down with no drops, legendaries first taken out of every
// holder, while a 20-tick particle wave runs down the shaft on its own. No
// entity is touched (L0-pntr-r006). Deviations from the spec: README.md.

import {
  type Block,
  BlockPermutation,
  BlockTypes,
  BlockVolume,
  type Dimension,
  type Entity,
  LiquidType,
  LocationInUnloadedChunkError,
  UnloadedChunksError,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { type BlockBox, HOLDER_TYPES, type ProtectResult, isLegendaryItemEntity, protectLegendariesIn } from "../legendary/recovery";
import { type Effect, registerEffect } from "./charge";
import { PENETRATOR_KEEP } from "./penetrator-keep";
import { type ColumnPlan, MASK_RADIUS, classify, isPlannedCell, layerOffsets, planColumn } from "./penetrator-plan";

export const EXPLOSION_SOUND = "random.explode";
/** Loud and low reads as "powerful" (L0-pntr-p003). */
export const EXPLOSION_VOLUME = 4;
export const EXPLOSION_PITCH = 0.7;

export const WAVE_TICKS = 20;
/** spawnParticle calls per tick per attack, hard cap (L0-pntr-p003, PN-3). */
export const WAVE_CAP = 16;
export const WAVE_EMITTER = "minecraft:huge_explosion_emitter";
export const WAVE_RIM = "minecraft:large_explosion";
const EMITTER_EVERY = 4;

/** Removed synchronously in the detonation tick: the part the player sees goes with the boom (PN-1). */
export const FIRST_TICK_LAYERS = 16;
/** Planned cells in one step of a column's removal, counted in whole bands. */
export const CELLS_PER_SLICE = 512;
/**
 * Script time all columns' removal may take per tick (PN-2). A step started
 * inside it runs to its end, so a tick can hold one step more. README.md has
 * the measurement that set it.
 */
export const REMOVAL_MS_PER_TICK = 25;

/** PN-1: a column up to this many layers, alone, has 3 ticks; a taller one, or one sharing its ticks with another, 6. */
const TYPICAL_LAYERS = 145;
const TYPICAL_TICKS = 3;
const WORST_TICKS = 6;

/**
 * How far apart two live columns may be and still share one `avoid` box: the
 * drop-spot search walks up to max(16, halfExtent + 4) rings outside it
 * (L0-adr-oprt §2), so a nearer column could receive the drop.
 */
const AVOID_REACH = 24;

const AIR = "minecraft:air";
const WATER = "minecraft:water";
const LIQUID_IDS = ["minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava"];
/** What the band fill never writes and counts as kept (L0-pntr-r002). */
export const KEEPERS: readonly string[] = [...PENETRATOR_KEEP, ...LIQUID_IDS];
const FRAMES: ReadonlySet<string> = new Set(["minecraft:frame", "minecraft:glow_frame"]);
const HOLDERS: ReadonlySet<string> = new Set(HOLDER_TYPES);
const SINGLE_CHEST_SLOTS = 27;

let knownKeeperIds: string[] | undefined;

/** KEEPERS the running engine knows: a query or fill filter naming an unknown type is refused whole. */
function knownKeepers(): string[] {
  knownKeeperIds ??= KEEPERS.filter((id) => BlockTypes.get(id) !== undefined);
  return knownKeeperIds;
}

/** L0-pntr-ent2. Counts are cells of the plan; `scanned` is every planned cell visited. */
export interface PenetratorReport {
  attackId: string;
  dimensionId: string;
  top: number;
  bottom: number;
  scanned: number;
  removed: number;
  kept: number;
  keptProtectFailed: number;
  skippedUnloaded: number;
  containersCleared: number;
  legendariesProtected: number;
  /** Detonation tick to the tick the last cell went, inclusive. */
  ticksUsed: number;
  air: number;
  /** Cells whose read or write threw something other than an unloaded chunk; logged, never rethrown. */
  errors: number;
  /** Layers finished while system.currentTick was still the detonation tick. */
  firstTickLayers: number;
  startedTick: number;
  endedTick: number;
  /** Wall-clock ms the removal spent in each tick, index 0 = the detonation tick. */
  msByTick: number[];
  /** Planned cells visited in each tick, same indexing. */
  cellsByTick: number[];
  /** ticksUsed against PN-1 for this column's height. */
  budgetTicks: number;
}

export type ReportObserver = (report: PenetratorReport) => void;

interface Job {
  plan: ColumnPlan;
  steps: Generator<void, void, void> | undefined;
  dim: Dimension;
  dimensionId: string;
  footprint: BlockBox;
  report: PenetratorReport;
  removing: boolean;
  waving: boolean;
  waveHandle: number | undefined;
  waveDone: Set<number>;
  rand: () => number;
}

const jobs = new Map<string, Job>();
const observers = new Set<ReportObserver>();

const log = (msg: string): void => console.warn(`[andrew] orbital pntr: ${msg}`);
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

/** Attacks whose removal or wave is still running. Neither outlives its attack (PN-3). */
export function penetratorJobs(): ReadonlyMap<string, { removing: boolean; waving: boolean }> {
  return jobs;
}

/** Calls `observer` with each attack's report when its removal ends. Returns the unsubscribe. */
export function observePenetratorReports(observer: ReportObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

/** The plan's 7×7 box over its full height. */
export function footprintOf(plan: ColumnPlan): BlockBox {
  return {
    min: { x: plan.cx - MASK_RADIUS, y: plan.bottom, z: plan.cz - MASK_RADIUS },
    max: { x: plan.cx + MASK_RADIUS, y: plan.top, z: plan.cz + MASK_RADIUS },
  };
}

function union(a: BlockBox, b: BlockBox): BlockBox {
  return {
    min: { x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y), z: Math.min(a.min.z, b.min.z) },
    max: { x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y), z: Math.max(a.max.z, b.max.z) },
  };
}

function gapXZ(a: BlockBox, b: BlockBox): number {
  const dx = Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x);
  const dz = Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z);
  return Math.max(dx, dz);
}

/**
 * Where a protected legendary must not land: this column and every live
 * column near it in the same dimension, so a drop never falls into a
 * neighbouring shaft (L0-pntr-ac04, L0-pntr-r007).
 */
export function avoidBox(own: BlockBox, dimensionId: string, live: Iterable<{ dimensionId: string; footprint: BlockBox }>): BlockBox {
  let box = own;
  for (const other of live) {
    if (other.dimensionId !== dimensionId || other.footprint === own) continue;
    if (gapXZ(other.footprint, own) <= AVOID_REACH) box = union(box, other.footprint);
  }
  return box;
}

export interface ParticleCall {
  effect: string;
  at: Vector3;
}

/**
 * Layers wave step `t` covers, top first: top − ceil(H·t/20) down to
 * top − ceil(H·(t+1)/20) + 1, so step 19 always ends at `bottom`. A step that
 * covers no new layer (H < 20) repeats the last layer covered, so every one
 * of the 20 ticks shows something.
 */
export function waveLayers(top: number, bottom: number, t: number): number[] {
  const h = top - bottom + 1;
  const from = top - Math.ceil((h * t) / WAVE_TICKS);
  const to = top - Math.ceil((h * (t + 1)) / WAVE_TICKS) + 1;
  if (from < to) return [from + 1];
  const ys: number[] = [];
  for (let y = from; y >= to; y--) ys.push(y);
  return ys;
}

/** Planned cells of layer `y` with at least one 4-neighbour outside the plan. */
function rimOffsets(plan: ColumnPlan, y: number): Array<{ dx: number; dz: number }> {
  const offsets = layerOffsets(plan, y);
  const inPlan = new Set(offsets.map((o) => `${o.dx},${o.dz}`));
  return offsets.filter(({ dx, dz }) => !inPlan.has(`${dx + 1},${dz}`) || !inPlan.has(`${dx - 1},${dz}`) || !inPlan.has(`${dx},${dz + 1}`) || !inPlan.has(`${dx},${dz - 1}`));
}

/** An even sample of `cap` items that keeps the first and the last. */
function sampleEvenly<T>(items: T[], cap: number): T[] {
  if (items.length <= cap) return items;
  const picked: T[] = [];
  for (let i = 0; i < cap; i++) picked.push(items[Math.round((i * (items.length - 1)) / (cap - 1))]);
  return picked;
}

/**
 * The spawnParticle calls of wave step `t`, top first: an emitter at the
 * centre of every 4th layer and one rim burst per layer, at most WAVE_CAP.
 */
export function waveCalls(plan: ColumnPlan, t: number, rand: () => number): ParticleCall[] {
  const ys = waveLayers(plan.top, plan.bottom, t);
  const repeat = ys.length === 1 && t > 0 && waveLayers(plan.top, plan.bottom, t - 1).includes(ys[0]);
  const calls: ParticleCall[] = [];
  for (const y of ys) {
    if (!repeat && (plan.top - y) % EMITTER_EVERY === 0) {
      calls.push({ effect: WAVE_EMITTER, at: { x: plan.cx + 0.5, y: y + 0.5, z: plan.cz + 0.5 } });
    }
    const rim = rimOffsets(plan, y);
    const o = rim.length > 0 ? rim[Math.floor(rand() * rim.length) % rim.length] : { dx: 0, dz: 0 };
    calls.push({ effect: WAVE_RIM, at: { x: plan.cx + o.dx + 0.5, y: y + 0.5, z: plan.cz + o.dz + 0.5 } });
  }
  return sampleEvenly(calls, WAVE_CAP);
}

function emitWave(job: Job, t: number): void {
  if (t < 0 || t >= WAVE_TICKS || job.waveDone.has(t)) return;
  job.waveDone.add(t);
  for (const call of waveCalls(job.plan, t, job.rand)) {
    try {
      job.dim.spawnParticle(call.effect, call.at);
    } catch {
      // An unloaded chunk refuses particles; the wave simply shows nothing there (L0-pntr-r008).
    }
  }
}

function startWave(job: Job): void {
  emitWave(job, 0);
  job.waveHandle = system.runInterval(() => {
    const t = system.currentTick - job.report.startedTick;
    emitWave(job, t);
    if (t >= WAVE_TICKS - 1) {
      if (job.waveHandle !== undefined) system.clearRun(job.waveHandle);
      job.waveHandle = undefined;
      job.waving = false;
      retireIfDone(job);
    }
  }, 1);
}

function isUnloaded(err: unknown): boolean {
  return err instanceof LocationInUnloadedChunkError;
}

function itemIdsIn(dim: Dimension, cell: Vector3): Set<string> {
  return new Set(dim.getEntities({ type: "minecraft:item", location: cell, volume: { x: 0, y: 0, z: 0 } }).map((e) => e.id));
}

/** What protect spilled from a frame, less any legendary: the frame's own stack and contents go with the column (L0-adr-oprt §3). */
function removeSpill(dim: Dimension, cell: Vector3, before: Set<string>): void {
  const spilled: Entity[] = dim.getEntities({ type: "minecraft:item", location: cell, volume: { x: 0, y: 0, z: 0 } }).filter((e) => !before.has(e.id));
  for (const entity of spilled) {
    if (!isLegendaryItemEntity(entity)) entity.remove();
  }
}

const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/**
 * A chest half whose container is both halves, next to a same-type block
 * outside the plan — or one that cannot be read. Its container cannot be
 * emptied alone, and setType on a paired half spills that half's items
 * (measured), so such a half stays.
 */
function pairedBeyondPlan(job: Job, block: Block, at: Vector3): boolean {
  const size = block.getComponent("minecraft:inventory")?.container?.size ?? 0;
  if (size <= SINGLE_CHEST_SLOTS) return false;
  return SIDES.some(([dx, dz]) => {
    const x = at.x + dx;
    const z = at.z + dz;
    if (isPlannedCell(job.plan, x, at.y, z)) return false;
    const next = job.dim.getBlock({ x, y: at.y, z });
    return next === undefined || next.typeId === block.typeId;
  });
}

/**
 * L0-pntr-r005: protect, empty and remove one holder in a single synchronous
 * step, so nothing can put a legendary back in between. A protection that
 * throws keeps the cell as it is (PN-5).
 */
function removeHolder(job: Job, block: Block, at: Vector3): boolean {
  const { dim, report } = job;
  const typeId = block.typeId;
  const waterlogged = block.isWaterlogged;
  if (pairedBeyondPlan(job, block, at)) {
    report.kept++;
    log(`attack ${report.attackId}: ${typeId} at ${fmt(at)} is half of a double chest reaching outside the column; the cell is kept`);
    return false;
  }
  const before = FRAMES.has(typeId) ? itemIdsIn(dim, at) : undefined;
  let result: ProtectResult;
  try {
    result = protectLegendariesIn(dim, { min: at, max: at }, { avoid: avoidBox(job.footprint, dim.id, jobs.values()), reason: `pntr ${report.attackId}` });
  } catch (err) {
    report.keptProtectFailed++;
    log(`attack ${report.attackId}: legendary protection threw at ${fmt(at)} (${typeId}); the cell is kept: ${String(err)}`);
    return false;
  }
  report.legendariesProtected += result.moved + result.handedBack;
  const container = block.getComponent("minecraft:inventory")?.container;
  if (container !== undefined) {
    container.clearAll();
    report.containersCleared++;
  }
  if (before !== undefined) removeSpill(dim, at, before);
  block.setType(waterlogged ? WATER : AIR);
  report.removed++;
  return true;
}

/** Stands for a cell left as it was whose type could not be read. */
const UNREAD = "";

/** The typeId left standing when the cell is not removed (kept, or a step that threw), else undefined. */
function removeCell(job: Job, at: Vector3): string | undefined {
  const { dim, report } = job;
  let block: Block | undefined;
  try {
    block = dim.getBlock(at);
    if (block === undefined) {
      report.skippedUnloaded++;
      return UNREAD;
    }
    const cls = classify({
      typeId: block.typeId,
      isAir: block.isAir,
      isLiquid: block.isLiquid,
      isWaterlogged: block.isWaterlogged,
      hasInventory: HOLDERS.has(block.typeId) || block.getComponent("minecraft:inventory") !== undefined,
    });
    if (cls === "skip") report.air++;
    else if (cls === "keep") {
      report.kept++;
      return block.typeId;
    } else if (cls === "removeContainer") return removeHolder(job, block, at) ? undefined : block.typeId;
    else {
      block.setType(cls === "removeWaterlogged" ? WATER : AIR);
      report.removed++;
    }
    return undefined;
  } catch (err) {
    if (isUnloaded(err)) {
      report.skippedUnloaded++;
      return UNREAD;
    }
    report.errors++;
    if (report.errors <= 3) log(`attack ${report.attackId}: cell ${fmt(at)} (${block?.typeId ?? "unread"}) threw ${String(err)}`);
    return block?.typeId ?? UNREAD;
  }
}

let specialIds: string[] | undefined;

/**
 * Types the band fill must not write blind: every holder lgnd lists
 * (L0-pntr-r005), and every type the engine says can hold water, so a
 * waterlogged one keeps its water (L0-pntr-as04). Read from the engine once.
 */
export function specialTypes(): string[] {
  if (specialIds !== undefined) return specialIds;
  const keepers = new Set(KEEPERS);
  const ids = new Set<string>();
  for (const type of BlockTypes.getAll()) {
    try {
      if (BlockPermutation.resolve(type.id).canContainLiquid(LiquidType.Water)) ids.add(type.id);
    } catch {
      // A type with no resolvable default permutation is left to the fill.
    }
  }
  for (const id of HOLDER_TYPES) if (BlockTypes.get(id) !== undefined) ids.add(id);
  specialIds = [...ids].filter((id) => !keepers.has(id));
  return specialIds;
}

interface Piece {
  volume: BlockVolume;
  min: Vector3;
  cells: number;
}

const chunkOf = (v: number): number => Math.floor(v / 16);

/** One band's planned cells as x-runs of one z row, cut at chunk borders so each run lies in one chunk. */
function bandRuns(plan: ColumnPlan, yHi: number): Array<{ x0: number; x1: number; z: number }> {
  const runs: Array<{ x0: number; x1: number; z: number }> = [];
  for (const { dx, dz } of layerOffsets(plan, yHi)) {
    const x = plan.cx + dx;
    const z = plan.cz + dz;
    const last = runs[runs.length - 1];
    if (last !== undefined && last.z === z && last.x1 === x - 1 && chunkOf(last.x1) === chunkOf(x)) last.x1 = x;
    else runs.push({ x0: x, x1: x, z });
  }
  return runs;
}

/**
 * The planned cells of whole bands yLo..yHi as boxes: a band's x-runs, each
 * stretched down through the following bands that repeat it, so one fill
 * covers what the mask keeps from band to band.
 */
function rangePieces(plan: ColumnPlan, yLo: number, yHi: number): Piece[] {
  const pieces: Piece[] = [];
  const open = new Map<string, { x0: number; x1: number; z: number; top: number; low: number }>();
  const close = (r: { x0: number; x1: number; z: number; top: number; low: number }): void => {
    const min = { x: r.x0, y: r.low, z: r.z };
    pieces.push({ volume: new BlockVolume(min, { x: r.x1, y: r.top, z: r.z }), min, cells: (r.x1 - r.x0 + 1) * (r.top - r.low + 1) });
  };
  for (let bandTop = yHi; bandTop >= yLo; bandTop -= plan.bandHeight) {
    const bandLow = Math.max(yLo, bandTop - plan.bandHeight + 1);
    const seen = new Set<string>();
    for (const run of bandRuns(plan, bandTop)) {
      const key = `${run.z},${run.x0},${run.x1}`;
      seen.add(key);
      const r = open.get(key);
      if (r !== undefined) r.low = bandLow;
      else open.set(key, { ...run, top: bandTop, low: bandLow });
    }
    for (const [key, r] of open) {
      if (!seen.has(key)) {
        close(r);
        open.delete(key);
      }
    }
  }
  for (const r of open.values()) close(r);
  return pieces;
}

function isUnloadedFill(err: unknown): boolean {
  return err instanceof UnloadedChunksError || err instanceof LocationInUnloadedChunkError;
}

/**
 * Whole bands yLo..yHi in one synchronous step, the ad01 hybrid: native
 * queries count what stays and find the holders and water-holding cells,
 * which go cell by cell through removeCell; then fillBlocks writes air over
 * the rest of the planned cells, excluding air, the keep set, liquids and
 * whatever a cell-by-cell step left standing. One query per step, not per
 * band: a query's cost is its type list, not its volume (README.md).
 */
function removeRange(job: Job, yLo: number, yHi: number): number {
  const { plan, dim, report } = job;
  const pieces = rangePieces(plan, yLo, yHi);
  const cells = pieces.reduce((n, p) => n + p.cells, 0);
  report.scanned += cells;
  const live: Piece[] = [];
  for (const piece of pieces) {
    if (dim.isChunkLoaded(piece.min)) live.push(piece);
    else report.skippedUnloaded += piece.cells;
  }
  if (live.length === 0) return cells;
  let loaded = live.reduce((n, p) => n + p.cells, 0);
  const box = new BlockVolume({ x: plan.cx - MASK_RADIUS, y: yLo, z: plan.cz - MASK_RADIUS }, { x: plan.cx + MASK_RADIUS, y: yHi, z: plan.cz + MASK_RADIUS });
  const planned = (at: Vector3): boolean => isPlannedCell(plan, at.x, at.y, at.z);

  // Order: counted before the cell-by-cell step, which turns waterlogged cells into water.
  let kept = 0;
  for (const at of dim.getBlocks(box, { includeTypes: knownKeepers() }, true).getBlockLocationIterator()) if (planned(at)) kept++;
  report.kept += kept;

  let special = 0;
  const standing = new Set<string>();
  for (const at of dim.getBlocks(box, { includeTypes: specialTypes() }, true).getBlockLocationIterator()) {
    if (!planned(at)) continue;
    special++;
    const left = removeCell(job, { x: at.x, y: at.y, z: at.z });
    if (left !== undefined) standing.add(left);
  }

  // A cell left standing with no readable type may be any special one: then none is written.
  const excludeTypes = [AIR, ...knownKeepers(), ...(standing.has(UNREAD) ? specialTypes() : standing)];
  let filled = 0;
  for (const piece of live) {
    try {
      filled += dim.fillBlocks(piece.volume, AIR, { blockFilter: { excludeTypes }, ignoreChunkBoundErrors: true }).getCapacity();
    } catch (err) {
      loaded -= piece.cells;
      if (isUnloadedFill(err)) report.skippedUnloaded += piece.cells;
      else {
        report.errors++;
        if (report.errors <= 3) log(`attack ${report.attackId}: fill ${fmt(piece.min)} threw ${String(err)}`);
      }
    }
  }
  report.removed += filled;
  report.air += Math.max(0, loaded - kept - special - filled);
  return cells;
}

function spend(job: Job, since: number, cells: number): void {
  const i = system.currentTick - job.report.startedTick;
  const { msByTick, cellsByTick } = job.report;
  while (msByTick.length <= i) msByTick.push(0);
  while (cellsByTick.length <= i) cellsByTick.push(0);
  msByTick[i] += Date.now() - since;
  cellsByTick[i] += cells;
}

/** The low end of the next step from `yHi`: whole bands, FIRST_TICK_LAYERS for the first, then about CELLS_PER_SLICE cells. */
function stepLow(plan: ColumnPlan, yHi: number, first: boolean): number {
  let cells = 0;
  for (let bandTop = yHi; ; bandTop -= plan.bandHeight) {
    const bandLow = Math.max(plan.bottom, bandTop - plan.bandHeight + 1);
    cells += layerOffsets(plan, bandTop).length * (bandTop - bandLow + 1);
    const enough = first ? plan.top - bandLow + 1 >= FIRST_TICK_LAYERS : cells >= CELLS_PER_SLICE;
    if (enough || bandLow === plan.bottom) return bandLow;
  }
}

/**
 * Top-down over the plan in whole bands. The first step is FIRST_TICK_LAYERS
 * layers — the caller runs it synchronously — and each later one about
 * CELLS_PER_SLICE cells, with a yield between steps.
 */
function* removal(job: Job): Generator<void, void, void> {
  const { plan, report } = job;
  let resumed = Date.now();
  for (let yHi = plan.top, first = true; yHi >= plan.bottom; first = false) {
    const yLo = stepLow(plan, yHi, first);
    const cells = removeRange(job, yLo, yHi);
    if (system.currentTick === report.startedTick) report.firstTickLayers = plan.top - yLo + 1;
    spend(job, resumed, cells);
    yHi = yLo - 1;
    if (yHi < plan.bottom) break;
    yield;
    resumed = Date.now();
  }
  finishRemoval(job);
}

function finishRemoval(job: Job): void {
  const { report } = job;
  job.removing = false;
  report.endedTick = system.currentTick;
  report.ticksUsed = report.endedTick - report.startedTick + 1;
  const over = report.ticksUsed > report.budgetTicks ? ` — OVER the PN-1 budget of ${report.budgetTicks} tick(s)` : "";
  log(`attack ${report.attackId} removal done${over}: ${JSON.stringify(report)}`);
  for (const observer of observers) {
    try {
      observer(report);
    } catch (err) {
      log(`report observer threw ${String(err)}`);
    }
  }
  retireIfDone(job);
}

function retireIfDone(job: Job): void {
  if (!job.removing && !job.waving) jobs.delete(job.report.attackId);
}

const stepper = { handle: undefined as number | undefined };

function stepOrStop(job: Job): boolean {
  try {
    return job.steps?.next().done !== false;
  } catch (err) {
    log(`attack ${job.report.attackId}: removal threw ${String(err)}; the column stops here`);
    finishRemoval(job);
    return true;
  }
}

/**
 * One tick of every column still being removed: a step each, round robin,
 * until REMOVAL_MS_PER_TICK is spent. A runJob would do this too, but on
 * BDS 1.26.51.1 the tick after a runJob is queued overruns by 15–30 ms even
 * when the job does nothing (probe_pntr_det_tick), so one shared interval
 * runs the steps instead, and only while a column is left.
 */
function stepAll(): void {
  const started = Date.now();
  let live = [...jobs.values()].filter((j) => j.steps !== undefined);
  while (live.length > 0 && Date.now() - started < REMOVAL_MS_PER_TICK) {
    for (const job of live) {
      if (stepOrStop(job)) job.steps = undefined;
      if (Date.now() - started >= REMOVAL_MS_PER_TICK) break;
    }
    live = live.filter((j) => j.steps !== undefined);
  }
  if (![...jobs.values()].some((j) => j.steps !== undefined) && stepper.handle !== undefined) {
    system.clearRun(stepper.handle);
    stepper.handle = undefined;
  }
}

/** The detonation-tick prefix now, the rest from the shared interval. Nothing a step throws propagates. */
function startRemoval(job: Job): void {
  job.steps = removal(job);
  if (stepOrStop(job)) {
    job.steps = undefined;
    return;
  }
  stepper.handle ??= system.runInterval(stepAll, 1);
}

function newReport(plan: ColumnPlan, dimensionId: string, tick: number, shared: boolean): PenetratorReport {
  const height = plan.top - plan.bottom + 1;
  return {
    attackId: plan.attackId,
    dimensionId,
    top: plan.top,
    bottom: plan.bottom,
    scanned: 0,
    removed: 0,
    kept: 0,
    keptProtectFailed: 0,
    skippedUnloaded: 0,
    containersCleared: 0,
    legendariesProtected: 0,
    ticksUsed: 0,
    air: 0,
    errors: 0,
    firstTickLayers: 0,
    startedTick: tick,
    endedTick: -1,
    msByTick: [],
    cellsByTick: [],
    budgetTicks: height <= TYPICAL_LAYERS && !shared ? TYPICAL_TICKS : WORST_TICKS,
  };
}

/**
 * L0-pntr-p001. The removal starts from a microtask: it still runs in the
 * detonation tick, but after every charge the flight lands in this tick has
 * registered its column, so same-tick neighbours share one `avoid` box.
 */
function detonate(dim: Dimension, point: Vector3, attackId: string): void {
  if (jobs.has(attackId)) {
    log(`attack ${attackId}: a second detonation ignored — one column per LMB`);
    return;
  }
  const plan = planColumn(attackId, point, dim.heightRange);
  const tick = system.currentTick;
  try {
    dim.playSound(EXPLOSION_SOUND, { x: plan.cx + 0.5, y: plan.top + 0.5, z: plan.cz + 0.5 }, { volume: EXPLOSION_VOLUME, pitch: EXPLOSION_PITCH });
  } catch (err) {
    log(`attack ${attackId}: the explosion sound threw ${String(err)}`);
  }
  const running = [...jobs.values()].filter((j) => j.removing);
  for (const other of running) other.report.budgetTicks = WORST_TICKS;
  const job: Job = {
    plan,
    steps: undefined,
    dim,
    dimensionId: dim.id,
    footprint: footprintOf(plan),
    report: newReport(plan, dim.id, tick, running.length > 0),
    removing: true,
    waving: true,
    waveHandle: undefined,
    waveDone: new Set(),
    rand: Math.random,
  };
  jobs.set(attackId, job);
  startWave(job);
  void Promise.resolve().then(() => startRemoval(job));
}

export const PENETRATOR_EFFECT: Effect = {
  layout: (target) => [{ x: target.x, z: target.z }],
  scale: 1,
  onDetonate(dim, point, _ownerId, _mode, attackId) {
    detonate(dim, point, attackId);
  },
};

export function registerPenetrator(): void {
  registerEffect("lmb", PENETRATOR_EFFECT);
  // Read once when the world loads, so the cost never lands in a detonation tick.
  world.afterEvents.worldLoad.subscribe(() => {
    knownKeepers();
    specialTypes();
  });
}
