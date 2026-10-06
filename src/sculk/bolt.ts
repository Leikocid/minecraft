// Sculk Crossbow bolts (spec §4, §8, §9, §11; L0-sclk-p002, p003, ent2, ent3, r001, r007). Every arrow
// the main-hand crossbow fires becomes one `andrew:sculk_bolt` in its spawn tick. One shared interval,
// alive only while a bolt is, draws the trail and expires bolts. A hit ends in a BoltEvent for the
// observers; damage, crater and sculk are theirs. Deviations: README.md (C-16).

import {
  type Dimension,
  type Direction,
  type Entity,
  EntityComponentTypes,
  type EntityLoadAfterEvent,
  type EntitySpawnAfterEvent,
  EquipmentSlot,
  Player,
  type ProjectileHitBlockAfterEvent,
  type ProjectileHitEntityAfterEvent,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { heldLegendaries } from "../legendary/hands";
import { SCULK_CROSSBOW } from "../legendary/registry";

export const BOLT_ID = "andrew:sculk_bolt";
export const ARROW_ID = "minecraft:arrow";
/** L0-xasm27, R-sclk-006. */
export const BOLT_LIFETIME_TICKS = 100;
/** R-sclk-007, K-sclk-2: at most this many trail particles per bolt per tick. */
export const TRAIL_PER_TICK = 3;
/** AD-sclk-02. The server cannot tell whether it renders (probe P3); only the iPad can (ac23). */
export const TRAIL_PARTICLE = "minecraft:sonic_explosion";
/**
 * Yaw added to the n-th arrow of one owner in one tick. The custom shooter's native Multishot fires
 * three arrows with no fan, all into one cell (probe P1); vanilla spreads them ±10°.
 */
export const MULTISHOT_YAW_DEGREES: readonly number[] = [0, -10, 10];

export interface BoltRecord {
  readonly bolt: Entity;
  readonly id: string;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly dimensionId: string;
  /** Replays the crater and the patch of this bolt; logged at launch. */
  readonly seed: number;
  readonly bornTick: number;
  /** As shot: the arrow's velocity, turned for a Multishot side bolt. */
  readonly velocity: Vector3;
  /** Shared by one Multishot volley, for logs only: outcomes are never merged (R-sclk-001). */
  readonly volleyId: string;
  readonly volleyIndex: number;
  lastPos: Vector3;
}

/**
 * `stalled`: the bolt kept its exact position for STALL_TICKS steps, which only an entity the engine
 * no longer ticks does. `gone`: the entity became invalid with no hit event — unloaded with its
 * chunk, or killed.
 */
export type ExpiryReason = "lifetime" | "unloaded" | "stalled" | "void" | "gone";

/** The block as hit, read in the hit tick: a live Block would already read as the crater carved it. */
export interface HitBlock {
  readonly typeId: string;
  readonly location: Vector3;
  readonly dimension: Dimension;
}

export type BoltEvent =
  | { kind: "launched"; record: BoltRecord; arrowVelocity: Vector3 | undefined }
  | { kind: "trail"; record: BoltRecord; points: readonly Vector3[] }
  | { kind: "entity"; record: BoltRecord; entity: Entity | undefined; location: Vector3 }
  | { kind: "block"; record: BoltRecord; block: HitBlock; face: Direction; location: Vector3 }
  | { kind: "expired"; record: BoltRecord; reason: ExpiryReason };

export type BoltObserver = (event: BoltEvent) => void;

/** Work that rides the bolt interval, such as the carve queue; the interval outlives the bolts while it is busy. */
export interface LoopRider {
  step(): void;
  busy(): boolean;
}

interface Volley {
  tick: number;
  id: string;
  next: number;
}

/**
 * A bolt that `remove_on_hit` takes off reads invalid in the interval before that tick's hit event
 * reaches the script, so an invalid bolt waits this long for its hit before it counts as gone.
 */
const GONE_GRACE_TICKS = 2;
/**
 * Past the simulation distance a chunk stays loaded but its entities stop ticking: isChunkLoaded
 * still answers true there, and the bolt hangs in place (measured in the End at 65 blocks).
 */
const STALL_TICKS = 2;

interface Flight {
  /** The tick the bolt was first seen invalid. */
  invalidSince?: number;
  /** Consecutive steps the bolt did not move. */
  still: number;
}

const records = new Map<string, BoltRecord>();
const flights = new Map<string, Flight>();
const observers: BoltObserver[] = [];
const riders: LoopRider[] = [];
const volleys = new Map<string, Volley>();
let handle: number | undefined;
let loopStarts = 0;
let armed = false;

const log = (msg: string): void => console.warn(`[andrew] sculk: ${msg}`);
const f2 = (n: number): string => n.toFixed(2);
const fmt = (v: Vector3): string => `${f2(v.x)},${f2(v.y)},${f2(v.z)}`;
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

export function observeBolts(observer: BoltObserver): () => void {
  observers.push(observer);
  return () => {
    const i = observers.indexOf(observer);
    if (i >= 0) observers.splice(i, 1);
  };
}

export function rideBoltLoop(rider: LoopRider): void {
  if (!riders.includes(rider)) riders.push(rider);
}

/** Starts the interval for a rider with work and no bolt in the air; a running interval is left as it is. */
export function wakeBoltLoop(): void {
  startLoop();
}

export function liveBoltCount(): number {
  return records.size;
}

export function boltLoopRunning(): boolean {
  return handle !== undefined;
}

/** How many times the shared interval has been created since load. */
export function boltLoopStarts(): number {
  return loopStarts;
}

function emit(event: BoltEvent): void {
  for (const observer of [...observers]) {
    try {
      observer(event);
    } catch (err) {
      log(`observer threw on ${event.kind} of bolt ${event.record.id}: ${errText(err)}`);
    }
  }
}

/** Turns `v` about the vertical axis by `degrees`; the speed and the vertical component are kept. */
export function turnYaw(v: Vector3, degrees: number): Vector3 {
  if (degrees === 0) return { x: v.x, y: v.y, z: v.z };
  const a = (degrees * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: v.x * c + v.z * s, y: v.y, z: v.z * c - v.x * s };
}

/** About one point per block, at most TRAIL_PER_TICK, spread over `from` (excluded) → `to` (included). */
export function trailPoints(from: Vector3, to: Vector3): Vector3[] {
  const length = Math.hypot(to.x - from.x, to.y - from.y, to.z - from.z);
  const n = Math.min(TRAIL_PER_TICK, Math.max(1, Math.ceil(length)));
  const points: Vector3[] = [];
  for (let i = 1; i <= n; i++) {
    const k = i / n;
    points.push({ x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k, z: from.z + (to.z - from.z) * k });
  }
  return points;
}

function startLoop(): void {
  if (handle !== undefined) return;
  handle = system.runInterval(step, 1);
  loopStarts++;
}

function settle(): void {
  if (records.size > 0 || handle === undefined || riders.some((r) => r.busy())) return;
  system.clearRun(handle);
  handle = undefined;
  volleys.clear();
}

/** Every arrow one owner fires in one tick is one Multishot volley. */
function volleySlot(ownerId: string): { id: string; index: number } {
  const tick = system.currentTick;
  let volley = volleys.get(ownerId);
  if (volley === undefined || volley.tick !== tick) {
    volley = { tick, id: `${tick}:${ownerId}`, next: 0 };
    volleys.set(ownerId, volley);
  }
  return { id: volley.id, index: volley.next++ };
}

function nameOf(entity: Entity): string {
  try {
    return entity instanceof Player ? entity.name : entity.typeId;
  } catch {
    return "?";
  }
}

function launch(
  owner: Entity,
  dimension: Dimension,
  location: Vector3,
  velocity: Vector3,
  volley: { id: string; index: number },
  arrowVelocity: Vector3 | undefined
): BoltRecord | undefined {
  let bolt: Entity;
  try {
    bolt = dimension.spawnEntity(BOLT_ID, location);
  } catch (err) {
    log(`bolt spawn refused at ${fmt(location)}: ${errText(err)}`);
    return undefined;
  }
  const projectile = bolt.getComponent(EntityComponentTypes.Projectile);
  if (projectile === undefined) {
    bolt.remove();
    log(`${BOLT_ID} has no projectile component`);
    return undefined;
  }
  projectile.owner = owner;
  projectile.shoot(velocity, { uncertainty: 0 });
  const record: BoltRecord = {
    bolt,
    id: bolt.id,
    ownerId: owner.id,
    ownerName: nameOf(owner),
    dimensionId: dimension.id,
    seed: Math.floor(Math.random() * 0x1_0000_0000) >>> 0,
    bornTick: system.currentTick,
    velocity: { x: velocity.x, y: velocity.y, z: velocity.z },
    volleyId: volley.id,
    volleyIndex: volley.index,
    lastPos: { x: location.x, y: location.y, z: location.z },
  };
  records.set(record.id, record);
  flights.set(record.id, { still: 0 });
  startLoop();
  log(
    `bolt ${record.id} owner ${record.ownerName} v ${f2(Math.hypot(velocity.x, velocity.y, velocity.z))} ` +
      `volley ${volley.id}#${volley.index} seed ${record.seed}`
  );
  emit({ kind: "launched", record, arrowVelocity });
  return record;
}

/** The swap's own path for a bolt that is not an arrow's; tests use it to place a bolt exactly. */
export function launchBolt(owner: Entity, dimension: Dimension, location: Vector3, velocity: Vector3): BoltRecord | undefined {
  return launch(owner, dimension, location, velocity, volleySlot(owner.id), undefined);
}

function ownerOf(arrow: Entity): Player | undefined {
  try {
    const owner = arrow.getComponent(EntityComponentTypes.Projectile)?.owner;
    return owner instanceof Player && owner.isValid ? owner : undefined;
  } catch {
    return undefined;
  }
}

function holdsCrossbow(player: Player): boolean {
  try {
    return heldLegendaries(player).some((held) => held.def === SCULK_CROSSBOW && held.slot === EquipmentSlot.Mainhand);
  } catch {
    return false;
  }
}

/**
 * The arrow's spawn tick is the fire tick (probe P1: +0, owner and velocity readable 16/16). An arrow
 * with no readable owner — a dispenser's, a skeleton's, a SimulatedPlayer's in a pack without the
 * gametest module — is not the crossbow's and is left alone.
 */
function onSpawn(event: EntitySpawnAfterEvent): void {
  const arrow = event.entity;
  if (!arrow.isValid || arrow.typeId !== ARROW_ID) return;
  const owner = ownerOf(arrow);
  if (owner === undefined || !holdsCrossbow(owner)) return;
  let location: Vector3;
  let velocity: Vector3;
  let dimension: Dimension;
  try {
    location = arrow.location;
    velocity = arrow.getVelocity();
    dimension = arrow.dimension;
  } catch (err) {
    log(`arrow ${arrow.id} of ${owner.name} without location/velocity, left alone: ${errText(err)}`);
    return;
  }
  const volley = volleySlot(owner.id);
  const turned = turnYaw(velocity, MULTISHOT_YAW_DEGREES[volley.index] ?? 0);
  // The bolt first: if the engine refuses it, the vanilla arrow flies on rather than the shot vanishing.
  if (launch(owner, dimension, location, turned, volley, velocity) === undefined) return;
  arrow.remove();
}

function isLoaded(dimension: Dimension, at: Vector3): boolean {
  try {
    return dimension.isChunkLoaded(at);
  } catch {
    return false;
  }
}

/**
 * The look-ahead takes the bolt off while it can still be removed: past the last loaded chunk it would
 * be saved with its chunk and come back on reload. Both reads clamp y into the dimension, where
 * isChunkLoaded answers false above and below it.
 */
function expiryOf(dimension: Dimension, at: Vector3, v: Vector3, age: number): ExpiryReason | undefined {
  const range = dimension.heightRange;
  if (at.y < range.min) return "void";
  const y = Math.min(Math.max(at.y, range.min), range.max - 1);
  if (!isLoaded(dimension, { x: at.x, y, z: at.z }) || !isLoaded(dimension, { x: at.x + v.x, y, z: at.z + v.z })) {
    return "unloaded";
  }
  if (age >= BOLT_LIFETIME_TICKS) return "lifetime";
  return undefined;
}

function drop(id: string): boolean {
  flights.delete(id);
  return records.delete(id);
}

/** Ends a record with no outcome: no damage, no crater, no sculk (L0-sclk-p003 §2). */
function expire(record: BoltRecord, reason: ExpiryReason, at: Vector3 = record.lastPos): void {
  if (!drop(record.id)) return;
  try {
    if (record.bolt.isValid) record.bolt.remove();
  } catch {
    // An entity in a chunk that is unloading may refuse; it comes back through entityLoad and is removed there.
  }
  log(`bolt ${record.id} expired ${reason} at age ${system.currentTick - record.bornTick} at ${fmt(at)}`);
  emit({ kind: "expired", record, reason });
}

function drawTrail(dimension: Dimension, record: BoltRecord, to: Vector3): void {
  const points = trailPoints(record.lastPos, to);
  record.lastPos = { x: to.x, y: to.y, z: to.z };
  for (const point of points) {
    try {
      dimension.spawnParticle(TRAIL_PARTICLE, point);
    } catch {
      // Cosmetic: a point in an unloaded chunk costs nothing but its ring.
    }
  }
  emit({ kind: "trail", record, points });
}

function step(): void {
  const now = system.currentTick;
  for (const record of records.values()) {
    const flight = flights.get(record.id) ?? { still: 0 };
    let at: Vector3;
    let v: Vector3;
    let dimension: Dimension;
    try {
      if (!record.bolt.isValid) throw new Error("invalid");
      at = record.bolt.location;
      v = record.bolt.getVelocity();
      dimension = record.bolt.dimension;
    } catch {
      flight.invalidSince ??= now;
      if (now - flight.invalidSince >= GONE_GRACE_TICKS) expire(record, "gone");
      continue;
    }
    const last = record.lastPos;
    const moved = at.x !== last.x || at.y !== last.y || at.z !== last.z;
    flight.still = moved ? 0 : flight.still + 1;
    const reason = expiryOf(dimension, at, v, now - record.bornTick) ?? (flight.still >= STALL_TICKS ? "stalled" : undefined);
    if (reason !== undefined) expire(record, reason, at);
    else if (moved) drawTrail(dimension, record, at);
  }
  for (const rider of riders) {
    try {
      rider.step();
    } catch (err) {
      log(`loop rider threw: ${errText(err)}`);
    }
  }
  settle();
}

/**
 * The record is deleted before anything acts, so a second event for the same bolt is a no-op
 * (R-sclk-001). remove_on_hit has already removed the bolt; its id still reads (probe P2c, 17/17).
 */
function claim(projectile: Entity): BoltRecord | undefined {
  let id: string;
  try {
    id = projectile.id;
  } catch {
    return undefined;
  }
  const record = records.get(id);
  if (record === undefined) return undefined;
  drop(id);
  try {
    if (record.bolt.isValid) record.bolt.remove();
  } catch {
    // Already gone with remove_on_hit.
  }
  return record;
}

function onHitEntity(event: ProjectileHitEntityAfterEvent): void {
  const record = claim(event.projectile);
  if (record === undefined) return;
  const entity = event.getEntityHit().entity;
  let what = "undefined";
  try {
    if (entity !== undefined) what = `${entity.typeId} ${entity.id}`;
  } catch {
    what = "gone";
  }
  drawTrail(event.dimension, record, event.location);
  log(`bolt ${record.id} hit entity ${what} at ${fmt(event.location)} age ${system.currentTick - record.bornTick}`);
  emit({ kind: "entity", record, entity, location: event.location });
  settle();
}

function onHitBlock(event: ProjectileHitBlockAfterEvent): void {
  const record = claim(event.projectile);
  if (record === undefined) return;
  const { block, face } = event.getBlockHit();
  const hit: HitBlock = { typeId: block.typeId, location: { x: block.location.x, y: block.location.y, z: block.location.z }, dimension: event.dimension };
  drawTrail(event.dimension, record, event.location);
  log(`bolt ${record.id} hit block ${hit.typeId}@${fmt(hit.location)} face ${face} age ${system.currentTick - record.bornTick}`);
  emit({ kind: "block", record, block: hit, face, location: event.location });
  settle();
}

/** A bolt that comes back with its chunk or after a restart has no outcome (C-23, L0-sclk-p003). */
function onLoad(event: EntityLoadAfterEvent): void {
  const entity = event.entity;
  if (!entity.isValid || entity.typeId !== BOLT_ID) return;
  const id = entity.id;
  const record = records.get(id);
  if (record !== undefined) {
    expire(record, "unloaded");
    settle();
  }
  if (entity.isValid) entity.remove();
  log(`bolt ${id} removed on load`);
}

export function registerBolts(): void {
  if (armed) return;
  armed = true;
  world.afterEvents.entitySpawn.subscribe(onSpawn);
  world.afterEvents.projectileHitEntity.subscribe(onHitEntity);
  world.afterEvents.projectileHitBlock.subscribe(onHitBlock);
  world.afterEvents.entityLoad.subscribe(onLoad);
}
