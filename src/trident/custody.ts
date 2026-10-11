// The custody ledger of the Above-Water Trident (L0-trdt-ecus, L0-trdt-adcl, L0-trdt-pfbk): where a thrown
// copy is while it is in no slot and on no ground. One world dynamic property holds every record; an
// in-memory clone of each thrown stack is what a normal return puts back. Every way out of custody ends
// here, in one synchronous turn: the clone inserted (`arrive`), the copy handed over through the
// legendary ledger (`deliver`), or a stale record dropped (`discard`). C-33, R-trdt-001.

import { type Container, type Entity, type ItemStack, type Player, type Vector3, system, world } from "@minecraft/server";
import { TRIDENT } from "../legendary/registry";
import { grant } from "../legendary/retention";
import { type Mark, returnTarget, withOwed } from "../legendary/rules";
import { bumpGen, isLive, offhandOf, readOwed, setOffhand, writeOwed } from "../legendary/state";
import { type CustodyRecord, parseLedger, serializeLedger } from "./throw-rules";

/** World property: every custody record of this pack. Dynamic properties are per pack. */
export const CUSTODY_KEY = "andrew:tr.custody";
/** Entity property: the throwId a custody entity belongs to. */
export const THROW_PROP = "andrew:tr.throw";
export const FLYING_ID = "andrew:trident_in_flight";
export const RETURNING_ID = "andrew:trident_returning";
export const CUSTODY_TYPES: ReadonlySet<string> = new Set([FLYING_ID, RETURNING_ID]);

const RETURNED_KEY = `${TRIDENT.textPrefix}.returned`;

const log = (msg: string): void => console.warn(`[andrew] trident custody: ${msg}`);
const fmt = (v: Vector3): string => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
const errText = (err: unknown): string => (err instanceof Error ? err.message : String(err)).split("\n")[0];

export type CustodyEventKind = "thrown" | "turned" | "arrived" | "delivered" | "discarded" | "stale";

export interface CustodyEvent {
  kind: CustodyEventKind;
  throwId: string;
  tick: number;
  how?: string;
  at?: Vector3;
  entityId?: string;
}

const observers = new Set<(event: CustodyEvent) => void>();

/** Calls `observer` after every custody transition. Returns the unsubscribe. */
export function onCustody(observer: (event: CustodyEvent) => void): () => void {
  observers.add(observer);
  return () => observers.delete(observer);
}

export function emit(event: Omit<CustodyEvent, "tick">): void {
  const full = { ...event, tick: system.currentTick };
  for (const observer of observers) {
    try {
      observer(full);
    } catch (err) {
      log(`an observer threw on ${event.kind}: ${errText(err)}`);
    }
  }
}

let ledger: Map<string, CustodyRecord> | undefined;
const clones = new Map<string, ItemStack>();

function records(): Map<string, CustodyRecord> {
  ledger ??= parseLedger(world.getDynamicProperty(CUSTODY_KEY));
  return ledger;
}

function save(): void {
  world.setDynamicProperty(CUSTODY_KEY, serializeLedger(records().values()));
}

/** A snapshot: changing it changes nothing. */
export function custodyRecords(): CustodyRecord[] {
  return [...records().values()].map((r) => ({ ...r, last: { ...r.last } }));
}

export function liveRecords(): IterableIterator<CustodyRecord> {
  return records().values();
}

export function recordCount(): number {
  return records().size;
}

export function getRecord(throwId: string): CustodyRecord | undefined {
  return records().get(throwId);
}

export function recordOfEntity(entityId: string): CustodyRecord | undefined {
  for (const record of records().values()) if (record.entityId === entityId) return record;
  return undefined;
}

export function hasClone(throwId: string): boolean {
  return clones.has(throwId);
}

/** Step 1 of a throw: the record and its clone exist before the hand is touched. */
export function put(record: CustodyRecord, clone: ItemStack): void {
  records().set(record.throwId, record);
  save();
  clones.set(record.throwId, clone);
}

/** Writes `record` back; `persist: false` keeps a per-tick change in memory until the next save. */
export function update(record: CustodyRecord, persist = true): void {
  records().set(record.throwId, record);
  if (persist) save();
}

function forget(throwId: string): void {
  records().delete(throwId);
  save();
  clones.delete(throwId);
}

/** Step undo of a failed throw: the clone went back to the hand, so the record goes. */
export function dropRecord(throwId: string): void {
  forget(throwId);
}

export function removeEntity(entityId: string | undefined): void {
  if (entityId === undefined) return;
  try {
    const entity = world.getEntity(entityId);
    if (entity?.isValid === true) entity.remove();
  } catch (err) {
    // An entity in an unloading chunk may refuse; it comes back through entityLoad as stale and goes there.
    log(`removing custody entity ${entityId} threw ${errText(err)}`);
  }
}

/** An online, living player who can take a stack right now (the same test as recovery's `reachable`). */
export function reachable(playerId: string): { player: Player; container: Container } | undefined {
  const player = world.getAllPlayers().find((p) => p?.isValid && p.id === playerId);
  const health = player?.getComponent("minecraft:health");
  const container = player?.getComponent("minecraft:inventory")?.container;
  if (player === undefined || container === undefined || (health !== undefined && health.currentValue <= 0)) {
    return undefined;
  }
  return { player, container };
}

/** A mark whose generation moved on (a loss return, an earlier delivery) is never inserted or delivered. */
export function discard(record: CustodyRecord, why: string): void {
  forget(record.throwId);
  removeEntity(record.entityId);
  log(`${record.throwId}: ${why}; mark ${record.mark?.id ?? "-"} gen ${record.mark?.gen ?? "-"} is stale, record dropped with no copy`);
  emit({ kind: "discarded", throwId: record.throwId, how: why, entityId: record.entityId });
}

/** Puts `stack` back where the throw took it from, else the selected slot, else anywhere, else at the feet. */
function insert(player: Player, container: Container, record: CustodyRecord, stack: ItemStack): string {
  if (record.hand === "off" && offhandOf(player) === undefined) {
    try {
      setOffhand(player, stack);
      return "off hand";
    } catch (err) {
      log(`${record.throwId}: the off hand refused the return (${errText(err)}), trying the inventory`);
    }
  }
  const selected = player.selectedSlotIndex;
  if (container.getItem(selected) === undefined) {
    container.setItem(selected, stack);
    return `slot ${selected}`;
  }
  const leftover = container.addItem(stack);
  if (leftover === undefined) return "inventory";
  player.dimension.spawnItem(leftover, player.location);
  return "at the feet (inventory full)";
}

/**
 * The normal end (L0-trdt-pthr step 8): the thrown stack itself, same generation, back to the thrower.
 * Insert, record deletion and entity removal happen in this one turn.
 */
export function arrive(record: CustodyRecord, player: Player, container: Container, at: Vector3): void {
  if (record.mark !== undefined && !isLive(TRIDENT, record.mark)) {
    discard(record, "arrived");
    return;
  }
  const clone = clones.get(record.throwId);
  if (clone === undefined) {
    deliver(record, "arrived without its clone");
    return;
  }
  const where = insert(player, container, record, clone);
  forget(record.throwId);
  removeEntity(record.entityId);
  try {
    player.dimension.playSound("item.trident.return", player.location);
  } catch {
    // Cosmetic.
  }
  log(`${record.throwId}: returned to ${player.name}, ${where}, mark ${record.mark?.id ?? "unmarked"} gen ${record.mark?.gen ?? "-"} at ${fmt(at)}`);
  emit({ kind: "arrived", throwId: record.throwId, at, how: where, entityId: record.entityId });
}

function deliverMarked(record: CustodyRecord, mark: Mark, how: string): string {
  // Order: the generation moves before the new stack exists, so a copy still somewhere (a held one left by a
  // crash mid-throw, a custody entity that reloads) is stale before a second one can be live. Mirrors
  // recovery's lost(); the owed ledger is what recovery redeems on the next playerSpawn.
  const next: Mark = { ...mark, gen: bumpGen(TRIDENT, mark.id) };
  const target = returnTarget(mark);
  const online = reachable(target);
  if (online !== undefined) {
    try {
      grant(TRIDENT, online.player, online.container, next, RETURNED_KEY);
      return `gen ${next.gen} handed to ${online.player.name}`;
    } catch (err) {
      log(`${record.throwId}: grant to ${online.player.name} threw ${errText(err)}; owed instead`);
    }
  }
  writeOwed(TRIDENT, withOwed(readOwed(TRIDENT), target, { mark: next, reason: `trident ${how}` }));
  return `gen ${next.gen} owed to ${mark.holderName ?? target} on their next spawn`;
}

function deliverUnmarked(record: CustodyRecord): string {
  const clone = clones.get(record.throwId);
  if (clone === undefined) return "an unmarked copy without its clone is lost, as vanilla loses it";
  const online = reachable(record.owner);
  if (online !== undefined) return `unmarked copy to ${online.player.name}, ${insert(online.player, online.container, record, clone)}`;
  try {
    const dimension = world.getDimension(record.dimension);
    if (dimension.isChunkLoaded(record.last)) {
      dimension.spawnItem(clone, record.last);
      return `unmarked copy dropped at ${fmt(record.last)}`;
    }
  } catch (err) {
    log(`${record.throwId}: dropping the unmarked copy threw ${errText(err)}`);
  }
  return "unmarked copy lost: no thrower and no loaded spot";
}

/**
 * Every fallback (L0-trdt-pfbk): the copy leaves custody through the legendary ledger. One turn: the
 * hand-over, the record deletion and the entity removal.
 */
export function deliver(record: CustodyRecord, how: string): void {
  if (record.mark !== undefined && !isLive(TRIDENT, record.mark)) {
    discard(record, how);
    return;
  }
  const result = record.mark === undefined ? deliverUnmarked(record) : deliverMarked(record, record.mark, how);
  forget(record.throwId);
  removeEntity(record.entityId);
  log(`${record.throwId}: ${how}; delivered, ${result}`);
  emit({ kind: "delivered", throwId: record.throwId, how, entityId: record.entityId });
}

/** The throwId on a custody entity, or undefined when it carries none (a /summon, another pack's entity). */
export function throwIdOf(entity: Entity): string | undefined {
  try {
    const value = entity.getDynamicProperty(THROW_PROP);
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}
