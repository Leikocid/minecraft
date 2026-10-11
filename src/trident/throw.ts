// The Above-Water Trident's throw and return (spec §02 item 4; L0-adr-twth, L0-trdt-pthr, L0-trdt-pfbk).
// A standing release of a charged trident throws it: the copy goes into custody (custody.ts), flies as
// `andrew:trident_in_flight` with the vanilla trajectory, and on a hit, a miss or a cap turns into an
// `andrew:trident_returning` body that one shared 1-tick interval steers back at 10 b/s, through blocks,
// until it is inserted into the thrower. A sneaking release is the dash (L0-trdt-pmov), not this module's.

import {
  type Dimension,
  type Entity,
  type EntityLoadAfterEvent,
  type EntityRemoveAfterEvent,
  type ItemReleaseUseAfterEvent,
  type ItemStack,
  type Player,
  type ProjectileHitBlockAfterEvent,
  type ProjectileHitEntityAfterEvent,
  type Vector3,
  system,
  world,
} from "@minecraft/server";
import { TRIDENT } from "../legendary/registry";
import { getMark, isLive, offhandOf, setOffhand, withLook } from "../legendary/state";
import {
  CUSTODY_TYPES,
  FLYING_ID,
  RETURNING_ID,
  THROW_PROP,
  arrive,
  custodyRecords,
  deliver,
  discard,
  dropRecord,
  emit,
  getRecord,
  hasClone,
  liveRecords,
  put,
  recordCount,
  recordOfEntity,
  removeEntity,
  throwIdOf,
  update,
} from "./custody";
import {
  CHEST_HEIGHT,
  type CustodyRecord,
  LAST_REFRESH_TICKS,
  LAUNCH_OFFSET,
  LAUNCH_SPEED,
  chargeOf,
  custodyAction,
  distance,
  releaseDecision,
  returnStep,
  runThrow,
} from "./throw-rules";

const DEFAULT_SCOPE = "main";

const log = (msg: string): void => console.warn(`[andrew] trident throw: ${msg}`);
const fmt = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
const errText = (err: unknown): string => (err instanceof Error ? err.message : String(err)).split("\n")[0];
const add = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const mul = (a: Vector3, k: number): Vector3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });

/** A second script runtime in the same world (the GameTest pack) sees our entities; the scope keeps it off them. */
let scope = DEFAULT_SCOPE;
let seq = 0;
let intervalId: number | undefined;
let held = false;

/** Per-tick movement memory, keyed by throwId; it never outlives its record. */
interface Motion {
  lastPos?: Vector3;
  still: number;
  expected?: Vector3;
  stall: number;
}
const motion = new Map<string, Motion>();

const isMine = (throwId: string | undefined): throwId is string => throwId !== undefined && throwId.startsWith(`${scope}-`);

function newThrowId(): string {
  return `${scope}-${Date.now().toString(36)}-${++seq}${Math.random().toString(36).slice(2, 6)}`;
}

interface Hand {
  hand: "main" | "off";
  slot: number;
  stack: ItemStack;
}

/** The stack the release used: the main hand when it holds a trident, else the off hand (vanilla use order). */
function handOf(player: Player): Hand | undefined {
  const container = player.getComponent("minecraft:inventory")?.container;
  const slot = player.selectedSlotIndex;
  const main = container?.getItem(slot);
  if (main?.typeId === TRIDENT.itemId) return { hand: "main", slot, stack: main };
  const off = offhandOf(player);
  if (off?.typeId === TRIDENT.itemId) return { hand: "off", slot, stack: off };
  return undefined;
}

function launch(player: Player, throwId: string): string {
  const view = player.getViewDirection();
  const at = add(player.getHeadLocation(), mul(view, LAUNCH_OFFSET));
  const entity = player.dimension.spawnEntity(FLYING_ID, at);
  try {
    entity.setDynamicProperty(THROW_PROP, throwId);
    const projectile = entity.getComponent("minecraft:projectile");
    if (projectile === undefined) throw new Error(`${FLYING_ID} has no minecraft:projectile`);
    projectile.owner = player;
    projectile.shoot(mul(view, LAUNCH_SPEED), { uncertainty: 0 });
  } catch (err) {
    entity.remove();
    throw err;
  }
  try {
    player.dimension.playSound("item.trident.throw", at);
  } catch {
    // Cosmetic.
  }
  return entity.id;
}

/** L0-adr-twth §2 / L0-trdt-pthr step 2, through `runThrow`, whose order the unit test holds. */
function throwFrom(player: Player): void {
  const from = handOf(player);
  if (from === undefined) return;
  const mark = getMark(TRIDENT, from.stack);
  if (mark !== undefined && !isLive(TRIDENT, mark)) {
    log(`${player.name} released a stale copy (id ${mark.id} gen ${mark.gen}); not thrown`);
    return;
  }
  const container = player.getComponent("minecraft:inventory")?.container;
  if (container === undefined) return;
  const clone = from.stack.clone();
  const now = system.currentTick;
  const record: CustodyRecord = {
    throwId: newThrowId(),
    owner: player.id,
    ownerName: player.name,
    hand: from.hand,
    slot: from.slot,
    state: "flying",
    dimension: player.dimension.id,
    last: player.getHeadLocation(),
    since: now,
  };
  if (mark !== undefined) record.mark = withLook(mark, from.stack);

  const outcome = runThrow({
    writeRecord: () => put(record, clone),
    clearHand: () => (from.hand === "main" ? container.setItem(from.slot, undefined) : setOffhand(player, undefined)),
    launch: () => launch(player, record.throwId),
    bindEntity: (entityId) => update({ ...record, entityId }),
    restoreHand: () => (from.hand === "main" ? container.setItem(from.slot, clone) : setOffhand(player, clone)),
    deleteRecord: () => dropRecord(record.throwId),
  });
  if (!outcome.thrown) {
    log(`${player.name}'s throw failed at ${outcome.failedAt}: ${errText(outcome.error)}; ${outcome.restored ? "the copy stays in the hand" : "the record stays for the fallback"}`);
    if (!outcome.restored) ensureLoop();
    return;
  }
  log(`${record.throwId}: ${player.name} threw ${mark === undefined ? "an unmarked copy" : `id ${mark.id} gen ${mark.gen}`} from the ${from.hand} hand, entity ${outcome.entityId}`);
  emit({ kind: "thrown", throwId: record.throwId, at: record.last, entityId: outcome.entityId });
  ensureLoop();
}

function onRelease(event: ItemReleaseUseAfterEvent): void {
  if (held) return;
  const player = event.source;
  if (player?.isValid !== true || event.itemStack?.typeId !== TRIDENT.itemId) return;
  if (releaseDecision(chargeOf(event.useDuration), player.isSneaking) !== "throw") return;
  throwFrom(player);
}

/**
 * L0-trdt-pthr step 6: the flying projectile becomes a return body at `at`. The new body exists and the
 * record names it before the projectile goes, so the record always names one entity.
 */
function turn(record: CustodyRecord, dimension: Dimension, at: Vector3, how: string): void {
  let body: Entity;
  try {
    body = dimension.spawnEntity(RETURNING_ID, at);
    body.setDynamicProperty(THROW_PROP, record.throwId);
  } catch (err) {
    deliver(record, `${how}, return body refused (${errText(err)})`);
    return;
  }
  const projectileId = record.entityId;
  update({ ...record, state: "returning", entityId: body.id, dimension: dimension.id, last: { ...at }, returnSince: system.currentTick });
  removeEntity(projectileId);
  motion.delete(record.throwId);
  log(`${record.throwId}: ${how} at ${fmt(at)}; returning as ${body.id}`);
  emit({ kind: "turned", throwId: record.throwId, how, at, entityId: body.id });
}

/** The record a projectile event is about, or undefined; a projectile of ours with no record is stale and goes. */
function flyingRecordOf(projectile: Entity): CustodyRecord | undefined {
  let id: string;
  try {
    if (projectile.typeId !== FLYING_ID) return undefined;
    id = projectile.id;
  } catch {
    return undefined;
  }
  const record = recordOfEntity(id);
  if (record !== undefined) return record.state === "flying" ? record : undefined;
  const throwId = projectile.isValid ? throwIdOf(projectile) : undefined;
  if (isMine(throwId)) removeStale(projectile, throwId, "hit");
  return undefined;
}

function onHitEntity(event: ProjectileHitEntityAfterEvent): void {
  if (held) return;
  const record = flyingRecordOf(event.projectile);
  if (record === undefined) return;
  let what = "an entity";
  try {
    what = event.getEntityHit().entity?.typeId ?? what;
  } catch {
    // Gone already.
  }
  turn(record, event.dimension, event.location, `hit ${what}`);
}

function onHitBlock(event: ProjectileHitBlockAfterEvent): void {
  if (held) return;
  const record = flyingRecordOf(event.projectile);
  if (record === undefined) return;
  let what = "a block";
  try {
    what = event.getBlockHit().block.typeId;
  } catch {
    // Unloaded already.
  }
  try {
    event.dimension.playSound("item.trident.hit_ground", event.location);
  } catch {
    // Cosmetic.
  }
  turn(record, event.dimension, event.location, `hit ${what}`);
}

function removeStale(entity: Entity, throwId: string, via: string): void {
  try {
    if (entity.isValid) entity.remove();
  } catch (err) {
    log(`removing stale ${throwId} threw ${errText(err)}`);
  }
  log(`stale custody entity ${throwId} removed on ${via}: no record names it`);
  emit({ kind: "stale", throwId, how: via });
}

/** L0-trdt-pfbk last rows: a custody entity whose throwId no record names, or names another entity, is stale. */
function checkLoaded(entity: Entity, via: string): void {
  if (!entity.isValid || !CUSTODY_TYPES.has(entity.typeId)) return;
  const throwId = throwIdOf(entity);
  if (!isMine(throwId)) return;
  const record = getRecord(throwId);
  if (record === undefined || record.entityId !== entity.id) removeStale(entity, throwId, via);
}

function onLoad(event: EntityLoadAfterEvent): void {
  checkLoaded(event.entity, "load");
}

/** Void, unload, /kill: the engine removed a custody entity we did not (ours update the record first). */
function onRemove(event: EntityRemoveAfterEvent): void {
  if (held || !CUSTODY_TYPES.has(event.typeId)) return;
  const record = recordOfEntity(event.removedEntityId);
  if (record !== undefined) deliver(record, "custody entity removed");
}

function ownerState(record: CustodyRecord): { player?: Player; state: "online" | "offline" | "dead" } {
  const player = world.getAllPlayers().find((p) => p?.isValid && p.id === record.owner);
  if (player === undefined) return { state: "offline" };
  const health = player.getComponent("minecraft:health");
  return { player, state: health !== undefined && health.currentValue <= 0 ? "dead" : "online" };
}

function resolve(record: CustodyRecord): Entity | undefined {
  if (record.entityId === undefined) return undefined;
  try {
    const entity = world.getEntity(record.entityId);
    return entity?.isValid === true ? entity : undefined;
  } catch {
    return undefined;
  }
}

function loaded(dimension: Dimension, at: Vector3): boolean {
  const range = dimension.heightRange;
  if (at.y < range.min) return false;
  try {
    return dimension.isChunkLoaded({ x: at.x, y: Math.min(at.y, range.max - 1), z: at.z });
  } catch {
    return false;
  }
}

function tickRecord(record: CustodyRecord, now: number): void {
  const owner = ownerState(record);
  const entity = resolve(record);
  const m = motion.get(record.throwId) ?? { still: 0, stall: 0 };
  motion.set(record.throwId, m);

  let at: Vector3 | undefined;
  let ahead: Vector3 | undefined;
  let target: Vector3 | undefined;
  if (entity !== undefined) {
    at = entity.location;
    if (record.state === "flying") {
      const moved = m.lastPos === undefined || distance(at, m.lastPos) > 0.001;
      m.still = moved ? 0 : m.still + 1;
      m.lastPos = { ...at };
      ahead = add(at, entity.getVelocity());
    } else {
      m.stall = m.expected !== undefined && distance(at, m.expected) > 0.1 ? m.stall + 1 : 0;
      if (owner.player !== undefined) {
        target = add(owner.player.location, { x: 0, y: CHEST_HEIGHT, z: 0 });
        ahead = returnStep(at, target).next;
      }
    }
  }
  const dimension = entity?.dimension;
  const action = custodyAction({
    state: record.state,
    now,
    since: record.since,
    returnSince: record.returnSince,
    live: record.mark === undefined ? undefined : isLive(TRIDENT, record.mark),
    hasClone: hasClone(record.throwId),
    owner: owner.state,
    sameDimension: owner.player === undefined || owner.player.dimension.id === record.dimension,
    entityValid: entity !== undefined,
    aheadLoaded: dimension !== undefined && at !== undefined && loaded(dimension, at) && (ahead === undefined || loaded(dimension, ahead)),
    stillTicks: m.still,
    stallTicks: m.stall,
  });

  switch (action.kind) {
    case "discard":
      discard(record, "custody check");
      return;
    case "deliver":
      deliver(record, action.how);
      return;
    case "turn":
      if (entity !== undefined && dimension !== undefined && at !== undefined) turn(record, dimension, at, action.how);
      return;
    case "go":
      break;
  }
  if (entity === undefined || at === undefined) return;
  const persist = now - record.since > 0 && (now - record.since) % LAST_REFRESH_TICKS === 0;
  if (record.state === "flying") {
    update({ ...record, last: { ...at } }, persist);
    return;
  }
  if (owner.player === undefined || target === undefined) return;
  const step = returnStep(at, target);
  if (step.arrived) {
    const container = owner.player.getComponent("minecraft:inventory")?.container;
    if (container === undefined) deliver(record, "thrower has no inventory");
    else arrive(record, owner.player, container, at);
    motion.delete(record.throwId);
    return;
  }
  entity.teleport(step.next, { facingLocation: target });
  m.expected = step.next;
  update({ ...record, last: step.next }, persist);
}

function step(): void {
  if (held) return;
  const now = system.currentTick;
  for (const record of [...liveRecords()]) {
    try {
      tickRecord(record, now);
    } catch (err) {
      log(`${record.throwId}: custody tick threw ${errText(err)}`);
    }
  }
  for (const throwId of motion.keys()) if (getRecord(throwId) === undefined) motion.delete(throwId);
  if (recordCount() === 0 && intervalId !== undefined) {
    system.clearRun(intervalId);
    intervalId = undefined;
  }
}

/** One interval for every record, alive only while one exists (L0-adr-twth §4: a shared runInterval). */
function ensureLoop(): void {
  if (intervalId === undefined && recordCount() > 0) intervalId = system.runInterval(step, 1);
}

/**
 * GameTest only: stops every custody transition in this runtime, so a server stop catches a record and its
 * entity exactly as they are — what a stop in that tick would save. A restart starts the runtime unheld.
 */
export function holdCustodyForRestart(): void {
  held = true;
  if (intervalId !== undefined) system.clearRun(intervalId);
  intervalId = undefined;
  log(`custody held for a restart with ${custodyRecords().length} record(s)`);
}

let armed = false;

/** `runtimeScope` prefixes this runtime's throwIds; a second script runtime in the same world needs its own. */
export function registerTridentThrow(runtimeScope: string = DEFAULT_SCOPE): void {
  if (armed) return;
  armed = true;
  scope = runtimeScope;
  world.afterEvents.itemReleaseUse.subscribe(onRelease);
  world.afterEvents.projectileHitEntity.subscribe(onHitEntity);
  world.afterEvents.projectileHitBlock.subscribe(onHitBlock);
  world.afterEvents.entityLoad.subscribe(onLoad);
  world.afterEvents.entityRemove.subscribe(onRemove);
  // Records from before a restart have no clone: the first tick delivers each (L0-trdt-pfbk "restart").
  world.afterEvents.worldLoad.subscribe(() => {
    for (const dimension of ["overworld", "nether", "the_end"]) {
      for (const type of CUSTODY_TYPES) {
        for (const entity of world.getDimension(dimension).getEntities({ type })) checkLoaded(entity, "world load");
      }
    }
    ensureLoop();
  });
  log(`armed (itemReleaseUse, projectile hits, entityLoad/Remove), scope ${scope}`);
}

