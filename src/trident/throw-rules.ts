// Pure rules of the Above-Water Trident's throw and return (spec §02 item 4; L0-adr-twth, L0-trdt-pthr,
// L0-trdt-pfbk, L0-trdt-ecus). Values in, values out: no engine call, so node tests bundle this file with
// esbuild. `../legendary/rules` is pure too.

import { type Mark, markFromValue } from "../legendary/rules";

export interface Vec {
  x: number;
  y: number;
  z: number;
}

/** The item's `use_modifiers.use_duration` of 3600 s; `itemReleaseUse.useDuration` is what is left of it (probe P3). */
export const USE_DURATION_TICKS = 72000;
/** Vanilla's shortest charge (L0-trdt-pthr step 1); a shorter release does nothing. */
export const MIN_CHARGE_TICKS = 10;
/** Probe P7: the vanilla throw leaves at 3.88–4.00 b/t. Gravity 0.10 and drag 0.99 are in the entity JSON. */
export const LAUNCH_SPEED = 3.9;
/** Spawned this far along the view from the eye: outside the thrower's own box on a level throw. */
export const LAUNCH_OFFSET = 0.4;
/** Spec §02: the return travels at 10 blocks/second. */
export const RETURN_STEP = 0.5;
/** L0-trdt-pthr step 8: arrival is within this distance of the chest point. */
export const ARRIVE_DISTANCE = 1.5;
/** The return aims at `location + CHEST_HEIGHT` of the thrower. */
export const CHEST_HEIGHT = 1.2;
/** L0-trdt-pthr step 3 (xasm36): a flight this long is a miss. */
export const FLIGHT_CAP_TICKS = 200;
/** AC 6: a return not finished in 30 s is delivered (L0-trdt-pfbk "return cap"). */
export const RETURN_CAP_TICKS = 600;
/** `record.last` is persisted this often (L0-trdt-pthr step 7). */
export const LAST_REFRESH_TICKS = 20;
/** A flying projectile that has not moved for this long is stuck without a hit event and turns back. */
export const STILL_TICKS = 10;
/** A return body found away from where it was steered for this many ticks in a row is not ticking. */
export const STALL_TICKS = 5;

/** The charge in ticks, from the remaining use duration the release event reports. */
export function chargeOf(useDuration: number): number {
  return USE_DURATION_TICKS - useDuration;
}

/** `dash` is the movement module's (L0-trdt-pmov); this module acts on `throw` only. */
export type ReleaseDecision = "throw" | "dash" | "too-short";

export function releaseDecision(charge: number, sneaking: boolean): ReleaseDecision {
  if (!(charge >= MIN_CHARGE_TICKS)) return "too-short";
  return sneaking ? "dash" : "throw";
}

const sub = (a: Vec, b: Vec): Vec => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const distance = (a: Vec, b: Vec): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export interface ReturnStep {
  /** True when `from` is already within ARRIVE_DISTANCE of `to`: insert now, do not move. */
  arrived: boolean;
  next: Vec;
  distance: number;
}

/** One tick of the steered return: `step` blocks straight at `to`, never past it. */
export function returnStep(from: Vec, to: Vec, step: number = RETURN_STEP, arrive: number = ARRIVE_DISTANCE): ReturnStep {
  const d = distance(from, to);
  if (d <= arrive) return { arrived: true, next: { ...from }, distance: d };
  const k = Math.min(step, d) / d;
  const v = sub(to, from);
  return { arrived: false, next: { x: from.x + v.x * k, y: from.y + v.y * k, z: from.z + v.z * k }, distance: d };
}

export type CustodyState = "flying" | "returning";

/** The custody record (L0-trdt-ecus), one per throw, keyed by `throwId`. */
export interface CustodyRecord {
  /** `<scope>-<absolute time>-<random>`; the custody entity carries it as `andrew:tr.throw`. */
  throwId: string;
  owner: string;
  ownerName: string;
  /** Where the stack left: the return prefers the same place when it is empty. */
  hand: "main" | "off";
  slot: number;
  /** With its look. Absent for an unmarked (Creative or /give) copy. */
  mark?: Mark;
  state: CustodyState;
  /** Absent only inside the throw's own sync block. */
  entityId?: string;
  dimension: string;
  last: Vec;
  /** world.getAbsoluteTime() at the throw and at the turn: unlike system.currentTick it survives a restart. */
  since: number;
  returnSince?: number;
}

const isVec = (v: unknown): v is Vec =>
  typeof v === "object" && v !== null && ["x", "y", "z"].every((k) => Number.isFinite((v as Record<string, unknown>)[k]));

/** One stored record, or undefined if it is malformed. A malformed mark drops the record, never the ledger. */
export function recordFromValue(value: unknown): CustodyRecord | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const r = value as Record<string, unknown>;
  const { throwId, owner, ownerName, hand, slot, mark, state, entityId, dimension, last, since, returnSince } = r;
  if (typeof throwId !== "string" || typeof owner !== "string" || typeof ownerName !== "string") return undefined;
  if ((hand !== "main" && hand !== "off") || !Number.isSafeInteger(slot)) return undefined;
  if ((state !== "flying" && state !== "returning") || typeof dimension !== "string" || !isVec(last)) return undefined;
  if (!Number.isFinite(since) || (returnSince !== undefined && !Number.isFinite(returnSince))) return undefined;
  if (entityId !== undefined && typeof entityId !== "string") return undefined;
  const record: CustodyRecord = {
    throwId,
    owner,
    ownerName,
    hand,
    slot: slot as number,
    state,
    dimension,
    last: { x: last.x, y: last.y, z: last.z },
    since: since as number,
  };
  if (mark !== undefined) {
    const parsed = markFromValue(mark);
    if (parsed === undefined) return undefined;
    record.mark = parsed;
  }
  if (entityId !== undefined) record.entityId = entityId;
  if (returnSince !== undefined) record.returnSince = returnSince as number;
  return record;
}

export function parseLedger(raw: unknown): Map<string, CustodyRecord> {
  const out = new Map<string, CustodyRecord>();
  if (typeof raw !== "string") return out;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return out;
  }
  if (!Array.isArray(value)) return out;
  for (const item of value as unknown[]) {
    const record = recordFromValue(item);
    if (record !== undefined) out.set(record.throwId, record);
  }
  return out;
}

export function serializeLedger(records: Iterable<CustodyRecord>): string | undefined {
  const list = [...records];
  return list.length === 0 ? undefined : JSON.stringify(list);
}

/** What the per-tick custody check sees of one record (L0-trdt-pfbk). */
export interface CustodyView {
  state: CustodyState;
  now: number;
  since: number;
  returnSince?: number;
  /** undefined for an unmarked copy. */
  live?: boolean;
  /** The in-memory clone exists; a record without one survived a restart. */
  hasClone: boolean;
  owner: "online" | "offline" | "dead";
  sameDimension: boolean;
  /** `world.getEntity(entityId)` resolves to a valid entity. */
  entityValid: boolean;
  /** The entity's cell and the cell it moves into next are loaded. */
  aheadLoaded: boolean;
  /** Ticks the flying projectile has not moved. */
  stillTicks: number;
  /** Ticks in a row the return body was not where it was steered. */
  stallTicks: number;
}

export type CustodyAction =
  | { kind: "discard" }
  | { kind: "deliver"; how: string }
  | { kind: "turn"; how: string }
  | { kind: "go" };

/**
 * One record, one tick. The order matters: a stale mark is never delivered; a record without its clone
 * (a restart) can only be delivered; the thrower's own state outranks the entity's.
 */
export function custodyAction(v: CustodyView): CustodyAction {
  if (v.live === false) return { kind: "discard" };
  if (!v.hasClone) return { kind: "deliver", how: "restart" };
  if (v.owner === "offline") return { kind: "deliver", how: "thrower offline" };
  if (v.owner === "dead") return { kind: "deliver", how: "thrower died" };
  if (!v.sameDimension) return { kind: "deliver", how: "thrower changed dimension" };
  if (!v.entityValid) return { kind: "deliver", how: "custody entity unloaded" };
  if (v.state === "returning") {
    if (v.now - (v.returnSince ?? v.since) > RETURN_CAP_TICKS) return { kind: "deliver", how: "return cap" };
    if (!v.aheadLoaded) return { kind: "deliver", how: "custody entity unloaded" };
    if (v.stallTicks >= STALL_TICKS) return { kind: "deliver", how: "custody entity not ticking" };
    return { kind: "go" };
  }
  if (v.now - v.since > FLIGHT_CAP_TICKS) return { kind: "turn", how: "flight cap" };
  if (!v.aheadLoaded) return { kind: "turn", how: "edge of the loaded world" };
  if (v.stillTicks >= STILL_TICKS) return { kind: "turn", how: "stuck" };
  return { kind: "go" };
}

/**
 * The engine side of one throw. Each step may throw. The order is L0-adr-twth §2: the record first, so a
 * failure after it leaves the copy in the hand AND in the record, which fallback delivery resolves to one
 * live copy (the held one goes stale); the hand first would leave a window where the copy is nowhere.
 */
export interface ThrowPort {
  writeRecord(): void;
  clearHand(): void;
  /** Spawns and launches the custody entity; returns its id. */
  launch(): string;
  bindEntity(entityId: string): void;
  /** Undo after a failed launch: the clone goes back where it came from. */
  restoreHand(): void;
  deleteRecord(): void;
}

export type ThrowStep = "record" | "clear" | "launch" | "bind";

export type ThrowOutcome =
  | { thrown: true; entityId: string }
  | { thrown: false; failedAt: ThrowStep; error: unknown; restored: boolean };

/** Runs one throw in one synchronous turn: record → clear → launch → bind. */
export function runThrow(port: ThrowPort): ThrowOutcome {
  try {
    port.writeRecord();
  } catch (error) {
    return { thrown: false, failedAt: "record", error, restored: true };
  }
  try {
    port.clearHand();
  } catch (error) {
    port.deleteRecord();
    return { thrown: false, failedAt: "clear", error, restored: true };
  }
  let entityId: string;
  try {
    entityId = port.launch();
  } catch (error) {
    // Hand before record: if the hand refuses the clone, the record stays and the fallback delivers it.
    try {
      port.restoreHand();
    } catch {
      return { thrown: false, failedAt: "launch", error, restored: false };
    }
    port.deleteRecord();
    return { thrown: false, failedAt: "launch", error, restored: true };
  }
  try {
    port.bindEntity(entityId);
  } catch (error) {
    // The record stays without an entity; the next custody tick delivers it.
    return { thrown: false, failedAt: "bind", error, restored: false };
  }
  return { thrown: true, entityId };
}
