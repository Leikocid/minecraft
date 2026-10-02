// The RMB effect (L0-ring-p002, p003, ad01–ad04): the five-ring layout, every
// contact queued, and the queue drained at most RING_MAX_BLASTS_PER_TICK a tick
// into one engine TNT explosion each — legendaries taken out first, block drops
// switched off around the blasts. ring spawns nothing and never touches a
// charge (L0-ring-r003, r009).
//
// Deviations from the spec (C-16, RG-6):
// 1. Queue delay (L0-ring-ad02). A charge is removed at contact; its blast
//    follows from the queue. The first drain runs from a microtask queued by
//    onDetonate — the contact tick, after the flight step that landed it — and
//    the rest one shared interval drains, ≤ RING_MAX_BLASTS_PER_TICK a tick
//    across all attacks, FIFO. A 201-charge attack on flat ground needs 5
//    ticks, three need 13 (RG-2).
// 2. The doTileDrops gate (L0-ring-ad01, L0-adr-odrp §5). One queue step sets
//    the world rule false around its createExplosion calls and puts back the
//    value it read, in `finally`, inside one synchronous stack. This file is
//    the rule's only writer in the add-on. Everything that happens inside the
//    window loses its block drops, so a mob or player killed by a blast still
//    drops loot (doMobLoot, keepInventory are untouched), but world TNT a ring
//    blast primes drops its blocks, since it goes off ticks later.
// 3. Item frames (L0-ring-r008, L0-adr-oprt §3). protectLegendariesIn breaks
//    every frame within ±8 of a step's blasts with `setblock … destroy` before
//    the window opens, so the frame and its item spill as ordinary items (the
//    legendary among them is moved). A frame beyond the blast's reach but
//    inside ±8 is broken too.
// 4. Nested storage (L0-lgnd-cx12). A legendary inside a shulker-box or
//    bundle *item* in a container survives only as far as lgnd reads nested
//    storage; otherwise it goes with the container.
// 5. Container fallback (L0-ring-as02, enabled). doTileDrops=false stops block
//    drops but not a destroyed container's contents (measured, see
//    CONTAINER_FALLBACK). So each step counts the contents of every container
//    within ±8 of its blasts, after protection, and after the window removes
//    new items of those types lying within 1 block of a container cell the
//    blasts destroyed, up to those counts, never a legendary. A same-type item
//    that happens to be there already is kept; a spilled item a later blast
//    of the same step threw further than 1 block stays.
// 6. No `source` (L0-ring-as03, L0-ring-r004). An explosion never damages its
//    own source entity (measured: a zombie as source took 0, the same blast
//    without it 23.5), so no blast names the owner. The owner takes TNT damage
//    like anyone; a kill reads "blown up", never "blown up by <owner>", and a
//    mob the rings kill drops its loot but no XP: XP needs a kill credited to
//    a player (measured: TNT a player lit, 3 orbs; unlit TNT and a ring blast,
//    none), which only `source` would give (L0-ring-r006, ac18).

import { BlockTypes, BlockVolume, type Dimension, type Entity, LocationInUnloadedChunkError, type Vector3, system, world } from "@minecraft/server";
import { type BlockBox, HOLDER_TYPES, isLegendaryItemEntity, protectLegendariesIn } from "../legendary/recovery";
import { observeAttacks } from "./activation";
import { type ContactProbe, type Effect, isContact, registerEffect } from "./charge";
import { activeAttacks, observeChargeEnds } from "./flight";
import { RING_LAYOUT, RING_MIN_RANGE, layout, powerAtOffset } from "./ring-layout";

/** RG-1, L0-ring-as05. Lower it (32, then 16) before anything else if RG-3 fails. */
export const RING_MAX_BLASTS_PER_TICK = 48;
export { RING_MIN_RANGE };

/** Vanilla TNT (L0-ring-r004): the strongest ring's power, and the fallback for a column the layout no longer holds. */
export const BLAST_POWER = 4;

/** How far a blast reaches item entities: 2 × power (L0-adr-oprt §1). */
export const PROTECT_MARGIN = 2 * BLAST_POWER;
/** A guard against a stuck interval, not a mode of work (L0-ring-p003 step 5). */
export const MAX_QUEUE_AGE_TICKS = 200;
/**
 * L0-ring-as02: on. Measured on BDS 1.26.51.1 (probe_ring_drops): a chest
 * holding 10 cobblestone destroyed by a ring blast under doTileDrops=false
 * spills all 10, while the dirt and stone it broke drop nothing.
 */
export const CONTAINER_FALLBACK = true;
/** A container half paired with its neighbour reports both halves (54 slots). */
const SINGLE_CHEST_SLOTS = 27;
/** Per-call cap of an engine volume query. */
const QUERY_CELLS = 32768;

/** The largest |dx| or |dz| of the layout: the ring footprint is the target ± this. */
const RING_REACH = Math.max(...RING_LAYOUT.columns.map((c) => Math.max(Math.abs(c.x), Math.abs(c.z))));
/** Another live attack this close to a protected box joins its `avoid`: the drop-spot search walks up to 16 rings out. */
const AVOID_REACH = 24;

const WATERS: ReadonlySet<string> = new Set(["minecraft:water", "minecraft:flowing_water"]);

/** L0-ring-ent2. In memory only: a restart drops it, like a charge in flight. */
interface QueuedBlast {
  attackId: string;
  dim: Dimension;
  point: Vector3;
  ownerId: string;
  /** The power of this column's ring, resolved at contact (L0-ring-r004). */
  power: number;
  enqueuedTick: number;
  /** Exploded, failed or lost: whatever happens to it, it happens once. */
  settled: boolean;
}

/** L0-ring report per attack, read by the gametests. */
export interface RingReport {
  attackId: string;
  dimensionId: string;
  /** onDetonate calls: one per charge that reached a contact cell. */
  charges: number;
  /** createExplosion calls that returned. */
  blasts: number;
  /** Blasts with breaksBlocks false (L0-ring-r007). */
  underwater: number;
  /** Dropped before exploding: unloaded cell (C-12), refused protection (C-15 rank 1), or older than MAX_QUEUE_AGE_TICKS. */
  lost: number;
  /** createExplosion calls that threw; logged, the rest of the step went on. */
  failed: number;
  /** The most createExplosion calls in one tick across ALL attacks, over the ticks this attack had blasts (RG-1). */
  maxBlastsInTick: number;
  /** First contact tick to last blast tick, inclusive (RG-2). */
  ticksToDrain: number;
  /** Longest wait of one blast in the queue, in ticks: the only delay ring adds (L0-ring-r002). */
  maxQueueTicks: number;
  /** Items the container fallback removed; 0 while it is off, since doTileDrops keeps them from existing. */
  itemsSuppressed: number;
  /** A protection call covering several attacks credits each of them. */
  legendariesMoved: number;
  legendariesHandedBack: number;
  protectCalls: number;
  firstTick: number;
  lastTick: number;
  /** This attack's createExplosion calls per tick, index 0 = firstTick. */
  blastsByTick: number[];
}

export type RingReportObserver = (report: RingReport) => void;

interface AttackState {
  report: RingReport;
  pending: number;
  /** The ring footprint when activation told us the target, else the box of the contact points seen so far. */
  footprint: BlockBox | undefined;
  seen: BlockBox | undefined;
}

interface Ready {
  blast: QueuedBlast;
  centre: Vector3;
  underwater: boolean;
}

const queue: QueuedBlast[] = [];
const states = new Map<string, AttackState>();
/** Targets of RMB attacks activation committed, until their first contact. */
const targets = new Map<string, Vector3>();
const observers = new Set<RingReportObserver>();
const loop = { handle: undefined as number | undefined, kicked: false, starts: 0, stops: 0, drains: 0, maxBlastsInTick: 0, gameRuleWrites: 0 };
const thisTick = { tick: -1, blasts: 0, attacks: new Set<string>() };

const log = (msg: string): void => console.warn(`[andrew] orbital ring: ${msg}`);
const fmt = (v: Vector3): string => `${v.x},${v.y},${v.z}`;

export interface RingLoop {
  running: boolean;
  queued: number;
  starts: number;
  stops: number;
  drains: number;
  /** The most createExplosion calls in any one tick since the world loaded. */
  maxBlastsInTick: number;
  /** doTileDrops writes, both directions. */
  gameRuleWrites: number;
}

/** Whether the queue interval exists, what is queued, and how the queue has run. */
export function ringLoop(): RingLoop {
  return {
    running: loop.handle !== undefined,
    queued: queue.length,
    starts: loop.starts,
    stops: loop.stops,
    drains: loop.drains,
    maxBlastsInTick: loop.maxBlastsInTick,
    gameRuleWrites: loop.gameRuleWrites,
  };
}

/** Calls `observer` with each attack's report once its last blast is done. Returns the unsubscribe. */
export function observeRingReports(observer: RingReportObserver): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

/**
 * L0-ring-r010: where a landed TNT would sit — the middle of the cell above
 * the contact cell, or of the contact cell itself when the one above is
 * solid by orbc's own test.
 */
export function blastCentre(point: Vector3, above: ContactProbe | undefined): Vector3 {
  const buried = above !== undefined && isContact(above);
  return { x: point.x + 0.5, y: point.y + (buried ? 0.5 : 1.5), z: point.z + 0.5 };
}

/** L0-ring-r007: water, flowing water, or a waterlogged block. Lava, bubble columns and cauldrons are not. */
export function isUnderwaterCell(cell: { typeId: string; isWaterlogged: boolean } | undefined): boolean {
  return cell !== undefined && (WATERS.has(cell.typeId) || cell.isWaterlogged);
}

function box(min: Vector3, max: Vector3): BlockBox {
  return { min: { ...min }, max: { ...max } };
}

function grow(b: BlockBox, by: number): BlockBox {
  return box({ x: b.min.x - by, y: b.min.y - by, z: b.min.z - by }, { x: b.max.x + by, y: b.max.y + by, z: b.max.z + by });
}

function union(a: BlockBox | undefined, b: BlockBox): BlockBox {
  if (a === undefined) return box(b.min, b.max);
  return box(
    { x: Math.min(a.min.x, b.min.x), y: Math.min(a.min.y, b.min.y), z: Math.min(a.min.z, b.min.z) },
    { x: Math.max(a.max.x, b.max.x), y: Math.max(a.max.y, b.max.y), z: Math.max(a.max.z, b.max.z) }
  );
}

function gapXZ(a: BlockBox, b: BlockBox): number {
  const dx = Math.max(0, a.min.x - b.max.x, b.min.x - a.max.x);
  const dz = Math.max(0, a.min.z - b.max.z, b.min.z - a.max.z);
  return Math.max(dx, dz);
}

function cellOf(v: Vector3): Vector3 {
  return { x: Math.floor(v.x), y: Math.floor(v.y), z: Math.floor(v.z) };
}

function newReport(attackId: string, dimensionId: string, tick: number): RingReport {
  return {
    attackId,
    dimensionId,
    charges: 0,
    blasts: 0,
    underwater: 0,
    lost: 0,
    failed: 0,
    maxBlastsInTick: 0,
    ticksToDrain: 0,
    maxQueueTicks: 0,
    itemsSuppressed: 0,
    legendariesMoved: 0,
    legendariesHandedBack: 0,
    protectCalls: 0,
    firstTick: tick,
    lastTick: tick,
    blastsByTick: [],
  };
}

function stateOf(attackId: string, dimensionId: string, tick: number): AttackState {
  let state = states.get(attackId);
  if (state === undefined) {
    const target = targets.get(attackId);
    const footprint =
      target === undefined
        ? undefined
        : box({ x: target.x - RING_REACH, y: target.y, z: target.z - RING_REACH }, { x: target.x + RING_REACH, y: target.y, z: target.z + RING_REACH });
    state = { report: newReport(attackId, dimensionId, tick), pending: 0, footprint, seen: undefined };
    states.set(attackId, state);
  }
  return state;
}

/** The attack's area ± PROTECT_MARGIN: where a protected legendary must not land. */
function attackAvoid(state: AttackState): BlockBox | undefined {
  const area = state.footprint === undefined ? state.seen : union(state.seen, state.footprint);
  return area === undefined ? undefined : grow(area, PROTECT_MARGIN);
}

function ensureInterval(): void {
  if (queue.length === 0 || loop.handle !== undefined) return;
  loop.handle = system.runInterval(drainTick, 1);
  loop.starts++;
}

function stopIfEmpty(): void {
  if (queue.length > 0 || loop.handle === undefined) return;
  system.clearRun(loop.handle);
  loop.handle = undefined;
  loop.stops++;
}

/**
 * The power of the column this contact cell belongs to. The charge carries no
 * power of its own: its offset from the attack's target names its column, and
 * the layout holds the ring's power. A contact outside the layout — the target
 * is gone, or a restart dropped it — falls back to the strongest, which is what
 * every column used before the rings were given their own powers.
 */
function powerOf(attackId: string, cell: Vector3): number {
  const target = targets.get(attackId);
  if (target === undefined) return BLAST_POWER;
  return powerAtOffset(cell.x - target.x, cell.z - target.z) ?? BLAST_POWER;
}

/** L0-ring-p003 step 1: enqueue and return; the first drain runs this same tick, after the caller's stack. */
function enqueue(dim: Dimension, point: Vector3, ownerId: string, attackId: string): void {
  const tick = system.currentTick;
  const state = stateOf(attackId, dim.id, tick);
  state.report.charges++;
  state.pending++;
  const cell = { x: point.x, y: point.y, z: point.z };
  state.seen = union(state.seen, box(cell, cell));
  queue.push({ attackId, dim, point: cell, ownerId, power: powerOf(attackId, cell), enqueuedTick: tick, settled: false });
  if (!loop.kicked) {
    loop.kicked = true;
    void Promise.resolve().then(kick);
  }
}

function kick(): void {
  loop.kicked = false;
  drain();
  ensureInterval();
  stopIfEmpty();
}

function drainTick(): void {
  drain();
  stopIfEmpty();
}

/** Counts the blast out of its attack, once: `outcome` is where it went. */
function settleBlast(blast: QueuedBlast, outcome: "blasts" | "failed" | "lost"): AttackState | undefined {
  if (blast.settled) return undefined;
  blast.settled = true;
  const state = states.get(blast.attackId);
  if (state === undefined) return undefined;
  state.report[outcome]++;
  state.pending--;
  return state;
}

function lose(blast: QueuedBlast, why: string): void {
  settleBlast(blast, "lost");
  log(`attack ${blast.attackId} (owner ${blast.ownerId}): blast at ${fmt(blast.point)} in ${blast.dim.id} lost: ${why}`);
}

/** L0-ring-p003 step 2: up to the tick's remaining cap from the head, FIFO over every attack. */
function drain(): void {
  const tick = system.currentTick;
  if (thisTick.tick !== tick) {
    thisTick.tick = tick;
    thisTick.blasts = 0;
    thisTick.attacks.clear();
  }
  const stale = new Set<string>();
  while (queue.length > 0 && tick - queue[0].enqueuedTick > MAX_QUEUE_AGE_TICKS) {
    const blast = queue.shift() as QueuedBlast;
    lose(blast, `queued ${tick - blast.enqueuedTick} ticks, over ${MAX_QUEUE_AGE_TICKS}`);
    stale.add(blast.attackId);
  }
  for (const id of stale) retireIfDone(id);
  const room = RING_MAX_BLASTS_PER_TICK - thisTick.blasts;
  if (room <= 0 || queue.length === 0) return;
  const batch = queue.splice(0, room);
  loop.drains++;
  try {
    step(batch, tick);
  } catch (err) {
    log(`queue step threw ${String(err)}`);
  }
  for (const blast of batch) if (!blast.settled) lose(blast, "the queue step threw before it");
  settle(batch, tick);
}

/** Every blast of `batch` ends up exploded, failed or lost; credit the tick's count and retire finished attacks. */
function settle(batch: QueuedBlast[], tick: number): void {
  for (const blast of batch) {
    const state = states.get(blast.attackId);
    if (state === undefined) continue;
    const { report } = state;
    report.maxBlastsInTick = Math.max(report.maxBlastsInTick, thisTick.blasts);
    report.maxQueueTicks = Math.max(report.maxQueueTicks, tick - blast.enqueuedTick);
  }
  for (const id of thisTick.attacks) {
    const state = states.get(id);
    if (state !== undefined) state.report.maxBlastsInTick = Math.max(state.report.maxBlastsInTick, thisTick.blasts);
  }
  loop.maxBlastsInTick = Math.max(loop.maxBlastsInTick, thisTick.blasts);
  for (const id of new Set(batch.map((b) => b.attackId))) retireIfDone(id);
}

/** L0-ring-r009: the attack's state goes once no charge of it falls and no blast of it is queued. */
function retireIfDone(attackId: string): void {
  const state = states.get(attackId);
  if (state === undefined || state.pending > 0 || activeAttacks().has(attackId)) return;
  states.delete(attackId);
  targets.delete(attackId);
  const { report } = state;
  report.ticksToDrain = report.lastTick - report.firstTick + 1;
  log(`attack ${attackId} done: ${JSON.stringify(report)}`);
  for (const observer of observers) {
    try {
      observer(report);
    } catch (err) {
      log(`report observer threw ${String(err)}`);
    }
  }
}

/** p002 steps 1–2: the contact cell must still be loaded (C-12); then centre and water. */
function resolve(blast: QueuedBlast): Ready | undefined {
  const { dim, point } = blast;
  let here;
  let above;
  try {
    here = dim.getBlock(point);
    above = here === undefined ? undefined : dim.getBlock({ x: point.x, y: point.y + 1, z: point.z });
  } catch (err) {
    if (!(err instanceof LocationInUnloadedChunkError)) throw err;
    here = undefined;
  }
  if (here === undefined) {
    lose(blast, "its chunk is not loaded");
    return undefined;
  }
  const centre = blastCentre(point, above);
  const centreCell = centre.y - point.y > 1 ? above : here;
  return { blast, centre, underwater: isUnderwaterCell(centreCell) };
}

interface Group {
  dim: Dimension;
  volume: BlockBox;
  attackIds: Set<string>;
  blasts: Ready[];
}

/**
 * L0-ring-ad04: one protection per dimension per step. Blasts of attacks whose
 * boxes do not touch get separate calls, so two players firing far apart never
 * make one box spanning both.
 */
function groups(ready: Ready[]): Group[] {
  const out: Group[] = [];
  for (const r of ready) {
    const c = cellOf(r.centre);
    const own = grow(box(c, c), PROTECT_MARGIN);
    let group = out.find((g) => g.dim.id === r.blast.dim.id && g.attackIds.has(r.blast.attackId));
    if (group === undefined) {
      group = { dim: r.blast.dim, volume: own, attackIds: new Set([r.blast.attackId]), blasts: [] };
      out.push(group);
    }
    group.volume = union(group.volume, own);
    group.blasts.push(r);
  }
  for (let merged = true; merged; ) {
    merged = false;
    for (let i = 0; i < out.length && !merged; i++) {
      for (let j = i + 1; j < out.length && !merged; j++) {
        const [a, b] = [out[i], out[j]];
        if (a.dim.id !== b.dim.id || gapXZ(a.volume, b.volume) > 0) continue;
        a.volume = union(a.volume, b.volume);
        for (const id of b.attackIds) a.attackIds.add(id);
        a.blasts.push(...b.blasts);
        out.splice(j, 1);
        merged = true;
      }
    }
  }
  return out;
}

/** Every live ring attack's area in the group's dimension within AVOID_REACH of it, its own included. */
function avoidFor(group: Group): BlockBox {
  let avoid = group.volume;
  for (const [id, state] of states) {
    if (state.report.dimensionId !== group.dim.id) continue;
    const area = attackAvoid(state);
    if (area === undefined) continue;
    if (group.attackIds.has(id) || gapXZ(area, group.volume) <= AVOID_REACH) avoid = union(avoid, area);
  }
  return avoid;
}

/** p002 step 3. Throws through to the caller: the group's blasts are then lost, never exploded unprotected. */
function protect(group: Group): void {
  const ids = [...group.attackIds];
  const result = protectLegendariesIn(group.dim, group.volume, { avoid: avoidFor(group), reason: `ring ${ids.join(",")}` });
  for (const id of ids) {
    const state = states.get(id);
    if (state === undefined) continue;
    state.report.protectCalls++;
    state.report.legendariesMoved += result.moved;
    state.report.legendariesHandedBack += result.handedBack;
  }
}

/**
 * One engine explosion at its ring's power, never with a `source`: the source
 * entity is spared the blast's damage (L0-ring-as03, measured), and the owner
 * must not be (L0-ring-r004).
 */
function explode(r: Ready, tick: number): void {
  const { blast, centre, underwater } = r;
  try {
    blast.dim.createExplosion(centre, blast.power, { breaksBlocks: !underwater, allowUnderwater: true, causesFire: false });
  } catch (err) {
    settleBlast(blast, "failed");
    log(`attack ${blast.attackId}: createExplosion at ${fmt(centre)} in ${blast.dim.id} threw ${String(err)}`);
    return;
  }
  thisTick.blasts++;
  thisTick.attacks.add(blast.attackId);
  const state = settleBlast(blast, "blasts");
  if (state === undefined) return;
  const { report } = state;
  if (underwater) report.underwater++;
  report.lastTick = tick;
  const i = tick - report.firstTick;
  while (report.blastsByTick.length <= i) report.blastsByTick.push(0);
  report.blastsByTick[i]++;
}

/**
 * p002 steps 4–7 over the protected blasts. The window is entered and left in
 * this one synchronous call: nothing here yields, so the world is never saved
 * with the rule switched off (L0-ring-ent3).
 */
function blastWindow(ready: Ready[], tick: number): void {
  const prev = world.gameRules.doTileDrops;
  try {
    if (prev) {
      world.gameRules.doTileDrops = false;
      loop.gameRuleWrites++;
    }
    for (const r of ready) explode(r, tick);
  } finally {
    if (world.gameRules.doTileDrops !== prev) {
      world.gameRules.doTileDrops = prev;
      loop.gameRuleWrites++;
    }
  }
}

/** L0-ring-ent3 `containerCells`: one container's non-legendary contents before the blasts. */
interface ContainerCell {
  dim: Dimension;
  at: Vector3;
  typeId: string;
  items: Map<string, number>;
  /** Item entities already within 1 block: never taken for spill. */
  before: Set<string>;
  attackIds: Set<string>;
}

let containerIds: string[] | undefined;

/** Holder types that carry a script inventory, as far as the running engine knows them. */
function knownContainers(): string[] {
  containerIds ??= HOLDER_TYPES.filter((id) => !/frame|crafter|decorated_pot|shelf/.test(id) && BlockTypes.get(id) !== undefined);
  return containerIds;
}

function itemsNear(dim: Dimension, at: Vector3): Entity[] {
  return dim.getEntities({ type: "minecraft:item", location: { x: at.x - 1, y: at.y - 1, z: at.z - 1 }, volume: { x: 2, y: 2, z: 2 } });
}

const SIDES = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

/** p002 step 4: the containers of a group's volume and what they hold. Frames were broken by protection already. */
function snapshotContainers(group: Group): ContainerCell[] {
  const { dim, volume } = group;
  const { min: floor, max: ceiling } = dim.heightRange;
  const y0 = Math.max(volume.min.y, floor);
  const y1 = Math.min(volume.max.y, ceiling - 1);
  const area = (volume.max.x - volume.min.x + 1) * (volume.max.z - volume.min.z + 1);
  const slab = Math.max(1, Math.floor(QUERY_CELLS / area));
  const cells: ContainerCell[] = [];
  const paired = new Set<string>();
  for (let y = y0; y <= y1; y += slab) {
    const query = new BlockVolume({ x: volume.min.x, y, z: volume.min.z }, { x: volume.max.x, y: Math.min(y1, y + slab - 1), z: volume.max.z });
    for (const loc of dim.getBlocks(query, { includeTypes: knownContainers() }, true).getBlockLocationIterator()) {
      const at = { x: loc.x, y: loc.y, z: loc.z };
      if (paired.has(fmt(at))) continue;
      const block = dim.getBlock(at);
      const container = block?.getComponent("minecraft:inventory")?.container;
      if (block === undefined || container === undefined) continue;
      if (container.size > SINGLE_CHEST_SLOTS) {
        for (const [dx, dz] of SIDES) if (dim.getBlock({ x: at.x + dx, y: at.y, z: at.z + dz })?.typeId === block.typeId) paired.add(fmt({ x: at.x + dx, y: at.y, z: at.z + dz }));
      }
      const items = new Map<string, number>();
      for (let slot = 0; slot < container.size; slot++) {
        const stack = container.getItem(slot);
        if (stack !== undefined) items.set(stack.typeId, (items.get(stack.typeId) ?? 0) + stack.amount);
      }
      if (items.size === 0) continue;
      cells.push({ dim, at, typeId: block.typeId, items, before: new Set(itemsNear(dim, at).map((e) => e.id)), attackIds: group.attackIds });
    }
  }
  return cells;
}

/** p002 step 8: take back what a destroyed container spilled. Returns the item count removed. */
function sweepSpill(cell: ContainerCell): number {
  const now = cell.dim.getBlock(cell.at);
  if (now !== undefined && now.typeId === cell.typeId) return 0;
  let removed = 0;
  for (const entity of itemsNear(cell.dim, cell.at)) {
    if (cell.before.has(entity.id) || !entity.isValid || isLegendaryItemEntity(entity)) continue;
    const stack = entity.getComponent("minecraft:item")?.itemStack;
    const left = stack === undefined ? 0 : (cell.items.get(stack.typeId) ?? 0);
    if (stack === undefined || left <= 0) continue;
    cell.items.set(stack.typeId, left - stack.amount);
    entity.remove();
    removed += stack.amount;
  }
  return removed;
}

function sweepContainers(cells: ContainerCell[]): void {
  for (const cell of cells) {
    let removed = 0;
    try {
      removed = sweepSpill(cell);
    } catch (err) {
      log(`container fallback at ${fmt(cell.at)} in ${cell.dim.id} threw ${String(err)}`);
    }
    if (removed === 0) continue;
    for (const id of cell.attackIds) {
      const state = states.get(id);
      if (state !== undefined) state.report.itemsSuppressed += removed;
    }
  }
}

/** L0-ring-p002: drop the unloaded, resolve, protect, snapshot containers, explode inside the window, sweep the spill. */
function step(batch: QueuedBlast[], tick: number): void {
  const ready: Ready[] = [];
  for (const blast of batch) {
    try {
      const r = resolve(blast);
      if (r !== undefined) ready.push(r);
    } catch (err) {
      lose(blast, `resolving it threw ${String(err)}`);
    }
  }
  const protectedBlasts: Ready[] = [];
  const containers: ContainerCell[] = [];
  for (const group of groups(ready)) {
    try {
      protect(group);
    } catch (err) {
      // C-15 rank 1 over the blast: no legendary may meet an explosion it was not taken out of.
      log(`legendary protection threw over ${fmt(group.volume.min)}..${fmt(group.volume.max)} in ${group.dim.id}; ${group.blasts.length} blast(s) not exploded: ${String(err)}`);
      for (const r of group.blasts) settleBlast(r.blast, "lost");
      continue;
    }
    protectedBlasts.push(...group.blasts);
    if (!CONTAINER_FALLBACK) continue;
    try {
      containers.push(...snapshotContainers(group));
    } catch (err) {
      log(`container snapshot threw over ${fmt(group.volume.min)}..${fmt(group.volume.max)} in ${group.dim.id}; its spill stays: ${String(err)}`);
    }
  }
  if (protectedBlasts.length === 0) return;
  blastWindow(protectedBlasts, tick);
  sweepContainers(containers);
}

export const RING_EFFECT: Effect = {
  layout: (target) => layout(target),
  scale: 0,
  minRange: RING_MIN_RANGE,
  onDetonate(dim, point, ownerId, _mode, attackId) {
    enqueue(dim, point, ownerId, attackId);
  },
};

export function registerRing(): void {
  registerEffect("rmb", RING_EFFECT);
  observeAttacks((attack) => {
    if (attack.mode === "rmb") targets.set(attack.attackId, { ...attack.target });
  });
  // A charge that ends without contact (void, lost, timeout) can be the attack's last.
  observeChargeEnds((end) => {
    const id = end.attack.attackId;
    if (end.attack.mode !== "rmb") return;
    void Promise.resolve().then(() => {
      retireIfDone(id);
      if (!states.has(id) && !activeAttacks().has(id)) targets.delete(id);
    });
  });
}
