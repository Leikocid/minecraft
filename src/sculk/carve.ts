// Block hit → crater and sculk (spec §6, §7, §11; L0-sclk-p005, L0-adr-sctr, ad04, ent4, r003, r004, r010).
// The plan is made in the hit tick (crater-plan.ts). Writes drain from one FIFO on the bolt interval at
// CARVE_BUDGET_PER_TICK cells a tick, crater cells before sculk cells, and protectLegendariesIn runs over
// a job's zone in every tick that writes it. No explosion, no entity is touched, no item is dropped by a
// carved block. Deviations: README.md (C-16).

import { type Block, type Dimension, LiquidType, type Vector3, system } from "@minecraft/server";
import { type BlockBox, HOLDER_TYPES, type ProtectResult, protectLegendariesIn } from "../legendary/recovery";
import { TERRAIN_KEEP } from "../terrain/keep";
import { type BoltEvent, observeBolts, rideBoltLoop, wakeBoltLoop } from "./bolt";
import { type CarvePlan, type CellKind, type Face, faceAxes, planCrater } from "./crater-plan";

/**
 * Cells visited (getBlock, then at most one setType) per tick across every job. SCLK-PROBE-01 §4 measured
 * 300 at 6–16 ms with the tick staying at 50–55 ms; ticks first stretched at 2400.
 */
export const CARVE_BUDGET_PER_TICK = 300;
export const SCULK = "minecraft:sculk";
const AIR = "minecraft:air";

/**
 * Full blocks that carry state of their own without a script inventory: sculk never replaces them (r004:
 * no block entity). Ids this engine lacks are harmless.
 */
const NOT_SCULK: ReadonlySet<string> = new Set(
  [
    "mob_spawner", "trial_spawner", "vault", "jukebox", "noteblock", "beehive", "bee_nest", "chiseled_bookshelf",
    "crafter", "lodestone", "beacon", "respawn_anchor", "piston", "sticky_piston", "suspicious_sand",
    "suspicious_gravel", "creaking_heart", "sculk_catalyst", "sculk_shrieker", "sculk_sensor",
    "calibrated_sculk_sensor", "enchanting_table", "lectern", "ender_chest",
  ].map((id) => `minecraft:${id}`)
);
const HOLDERS: ReadonlySet<string> = new Set(HOLDER_TYPES);

export interface CarveReport {
  boltId: string;
  dimensionId: string;
  impact: Vector3;
  face: Face;
  seed: number;
  plan: CarvePlan;
  /** What protectLegendariesIn clears: the plan's box and the layer outside the face above it. */
  zone: BlockBox | undefined;
  /** Planned cells this job actually turned to air / to sculk. */
  carved: Vector3[];
  sculked: Vector3[];
  /** Planned cells found changed at write time (now air, liquid, kept, unloaded, no longer exposed). */
  skipped: number;
  /** Holder cells left standing because protectLegendariesIn refused the box. */
  keptHolders: number;
  protect: ProtectResult;
  protectErrors: string[];
  hitTick: number;
  doneTick: number;
}

export type CarveObserver = (report: CarveReport) => void;

interface CarveJob {
  readonly boltId: string;
  readonly dimension: Dimension;
  readonly plan: CarvePlan;
  readonly hitTick: number;
  cursor: number;
  protectedTick: number;
  holdersLocked: boolean;
  readonly report: CarveReport;
}

const jobs: CarveJob[] = [];
const observers: CarveObserver[] = [];
let budgetTick = -1;
let spent = 0;
let armed = false;

const log = (msg: string): void => console.warn(`[andrew] sculk: ${msg}`);
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

export function observeCarves(observer: CarveObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

export function pendingCarves(): number {
  return jobs.length;
}

function blockAt(dimension: Dimension, at: Vector3): Block | undefined {
  try {
    return dimension.getBlock(at);
  } catch {
    return undefined;
  }
}

/**
 * Stable 2.10.0 has no "is solid" query. A full block stops water and cannot be waterlogged; a slab, a stair,
 * a fence can hold water, and a flower or a torch lets it through.
 */
export function kindOf(block: Block | undefined): CellKind {
  if (block === undefined) return "unloaded";
  try {
    if (block.isAir) return "air";
    if (block.isLiquid) return "liquid";
    const type = block.typeId;
    if (TERRAIN_KEEP.has(type)) return "keep";
    if (NOT_SCULK.has(type) || HOLDERS.has(type) || block.getComponent("minecraft:inventory") !== undefined) return "other";
    if (!block.isLiquidBlocking(LiquidType.Water)) return "passable";
    return block.canContainLiquid(LiquidType.Water) ? "other" : "solid";
  } catch {
    return "unloaded";
  }
}

export function probeOf(dimension: Dimension): (at: Vector3) => CellKind {
  return (at) => kindOf(blockAt(dimension, at));
}

function emit(report: CarveReport): void {
  for (const observer of [...observers]) {
    try {
      observer(report);
    } catch (err) {
      log(`carve observer threw for bolt ${report.boltId}: ${errText(err)}`);
    }
  }
}

/**
 * Takes live legendaries out of the job's box before this tick's writes. When lgnd refuses the box (a holder
 * with no script inventory, a frame that would not break, an unloaded chunk), nothing was moved, so every
 * holder and frame cell of the job is left standing instead.
 */
function protect(job: CarveJob): void {
  const zone = job.report.zone;
  if (zone === undefined || job.holdersLocked) return;
  try {
    const r = protectLegendariesIn(job.dimension, zone, { reason: `sculk crater ${job.boltId}` });
    job.report.protect.moved += r.moved;
    job.report.protect.handedBack += r.handedBack;
  } catch (err) {
    job.holdersLocked = true;
    job.report.protectErrors.push(errText(err));
    log(`crater ${job.boltId}: protect refused the box, holders stay: ${errText(err)}`);
  }
}

function exposedAfter(dimension: Dimension, at: Vector3, face: Face): boolean {
  const { out } = faceAxes(face);
  const kind = kindOf(blockAt(dimension, { x: at.x + out.x, y: at.y + out.y, z: at.z + out.z }));
  return kind === "air" || kind === "passable";
}

/** One planned cell, re-checked against the world as it is now. */
function write(job: CarveJob, index: number): void {
  const { plan, dimension, report } = job;
  const crater = index < plan.air.length;
  const at = crater ? plan.air[index] : plan.sculk[index - plan.air.length];
  const block = blockAt(dimension, at);
  const kind = kindOf(block);
  try {
    if (block === undefined) {
      report.skipped++;
    } else if (crater) {
      if (kind === "air" || kind === "liquid" || kind === "keep" || kind === "unloaded") report.skipped++;
      else if (job.holdersLocked && HOLDERS.has(block.typeId)) report.keptHolders++;
      else {
        block.setType(AIR);
        report.carved.push(at);
      }
    } else if (kind !== "solid" || !exposedAfter(dimension, at, plan.face)) {
      report.skipped++;
    } else if (block.typeId === SCULK) {
      report.skipped++;
    } else {
      block.setType(SCULK);
      report.sculked.push(at);
    }
  } catch (err) {
    report.skipped++;
    log(`crater ${job.boltId}: ${crater ? "air" : "sculk"} at ${fmt(at)} refused: ${errText(err)}`);
  }
}

function finish(job: CarveJob): void {
  const r = job.report;
  r.doneTick = system.currentTick;
  log(
    `crater ${r.boltId} done: crater ${r.carved.length}/${r.plan.air.length} cells, sculk ${r.sculked.length}/${r.plan.sculk.length} cells ` +
      `at ${fmt(r.impact)} face ${r.face} seed ${r.seed}; skipped ${r.skipped}, holders kept ${r.keptHolders}, ` +
      `legendaries moved ${r.protect.moved} handed back ${r.protect.handedBack}, ticks ${r.doneTick - r.hitTick + 1}`
  );
  emit(r);
}

/** Spends what is left of this tick's budget, oldest job first, keeping each job's order. */
function drain(): void {
  const now = system.currentTick;
  if (budgetTick !== now) {
    budgetTick = now;
    spent = 0;
  }
  while (jobs.length > 0 && spent < CARVE_BUDGET_PER_TICK) {
    const job = jobs[0];
    const total = job.plan.air.length + job.plan.sculk.length;
    if (job.protectedTick !== now) {
      job.protectedTick = now;
      protect(job);
    }
    while (job.cursor < total && spent < CARVE_BUDGET_PER_TICK) {
      write(job, job.cursor++);
      spent++;
    }
    if (job.cursor < total) break;
    jobs.shift();
    finish(job);
  }
}

/** The plan's box grown by one layer out of the face: a legendary lying on the cells about to go is in the zone. */
function zoneOf(plan: CarvePlan): BlockBox | undefined {
  const box = plan.box;
  if (box === undefined) return undefined;
  const { out } = faceAxes(plan.face);
  return {
    min: { x: Math.min(box.min.x, box.min.x + out.x), y: Math.min(box.min.y, box.min.y + out.y), z: Math.min(box.min.z, box.min.z + out.z) },
    max: { x: Math.max(box.max.x, box.max.x + out.x), y: Math.max(box.max.y, box.max.y + out.y), z: Math.max(box.max.z, box.max.z + out.z) },
  };
}

/**
 * Plans the crater of one block hit and queues it. The writes this tick's budget allows land at once, the
 * rest on the following ticks of the bolt interval.
 */
export function carveBlockHit(boltId: string, dimension: Dimension, impact: Vector3, face: Face, seed: number): CarveReport {
  const plan = planCrater(impact, face, seed, probeOf(dimension));
  const report: CarveReport = {
    boltId,
    dimensionId: dimension.id,
    impact: { ...impact },
    face,
    seed,
    plan,
    zone: zoneOf(plan),
    carved: [],
    sculked: [],
    skipped: 0,
    keptHolders: 0,
    protect: { moved: 0, handedBack: 0 },
    protectErrors: [],
    hitTick: system.currentTick,
    doneTick: -1,
  };
  log(`crater ${boltId} planned: crater ${plan.air.length} cells, sculk ${plan.sculk.length} cells at ${fmt(impact)} face ${face} seed ${seed}`);
  jobs.push({ boltId, dimension, plan, hitTick: report.hitTick, cursor: 0, protectedTick: -1, holdersLocked: false, report });
  drain();
  if (jobs.length > 0) wakeBoltLoop();
  return report;
}

function onBolt(event: BoltEvent): void {
  if (event.kind !== "block") return;
  const { record, block, face } = event;
  carveBlockHit(record.id, block.dimension, block.location, face as Face, record.seed);
}

export function registerCarve(): void {
  if (armed) return;
  armed = true;
  rideBoltLoop({ step: drain, busy: () => jobs.length > 0 });
  observeBolts(onBolt);
}
