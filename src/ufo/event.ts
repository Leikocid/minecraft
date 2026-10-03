// The UFO event core (L0-ufoc): at most one live session, a phase machine
// stepped once per interval tick, the schedule's idle check every
// IDLE_CHECK_TICKS, the operator command queue, and the restart sweeps.
// Phases count interval ticks; the schedule compares epoch ms (L0-ufoc-ad01).
// The surface `sauc` and `magn` build on is L0-adr-ufpc: onPhase, saucerStep,
// magnetStep, saucerPosition, requestMagnetOff, reportShotDown.

import type { Dimension, Entity, EntityQueryOptions, Vector3 } from "@minecraft/server";
import type { UfoEnv, UfoPlayer } from "./env";
import { UfoSchedule } from "./schedule";

export const IDLE_CHECK_TICKS = 100;
export const HOVER_ABOVE = 40;
/**
 * UFO §2: the hover point is at most ceiling − 15, so the legs at hover + 10
 * stay under the ceiling and an Orbital charge (spawned at ceiling − 1 at most)
 * always starts above the hull.
 */
export const CEILING_MARGIN = 15;
/** UFO §7, L0-ufoc-as05: horizontal blocks from the centre. */
export const NOTICE_RANGE = 150;
export const ARRIVAL_TEXT = "andrew.ufo.arrival";

export const SAUCER_ID = "andrew:ufo_saucer";
export const UFO_TAG = "andrew:ufo";
export const UFO_FAMILY = "andrew_ufo";
/** The saucer carries `andrew:ufo_event:<eventId>`; tags, unlike dynamic properties, are read by every pack. */
export const EVENT_TAG = "andrew:ufo_event:";
/** Set by `magn` on what it holds; stripped when no session of this runtime is live. */
export const IRON_TAG = "andrew:ufo_iron";

export const UFO_ACTIONS = ["come", "stop", "enable", "disable"] as const;
export type UfoAction = (typeof UFO_ACTIONS)[number];

export type Phase = "arrival" | "magnet" | "release" | "departure" | "pause" | "downed";
export type LivePhase = "arrival" | "magnet" | "departure" | "downed";
export type OffReason = "shot" | "stop" | "abort";
export type EndReason = "departed" | "downed" | "stop" | "abort";

export interface PhasePayload {
  readonly centre: Readonly<Vector3>;
  readonly hoverY: number;
  readonly saucerPos: Readonly<Vector3> | undefined;
  readonly eventId: string;
}

export interface PhaseListener {
  onPhase(phase: Phase, payload: PhasePayload): void;
}

/** `sauc`'s side of L0-adr-ufpc. */
export interface Saucer extends PhaseListener {
  saucerStep(tick: number): void;
  /** This tick's position; undefined when there is no valid saucer. */
  saucerPosition(): Vector3 | undefined;
  /** In `downed`: the fall has ended (L0-adr-ufsd §2). */
  fallFinished?(): boolean;
}

/** `magn`'s side of L0-adr-ufpc. */
export interface Magnet extends PhaseListener {
  magnetStep(tick: number): void;
}

/** L0-ufoc-ent2: memory only, never persisted. */
export interface Session {
  readonly eventId: string;
  phase: LivePhase;
  /** Interval ticks elapsed in the current phase. */
  phaseTick: number;
  readonly centre: Readonly<Vector3>;
  readonly hoverY: number;
  readonly targetId: string;
  readonly source: "schedule" | "command";
  offLatch: OffReason | undefined;
  /** Set at magnet-on, cleared by the release; a shot moves `phase` to downed first (L0-adr-ufsd §1). */
  magnetOn: boolean;
  downedHandled: boolean;
  /** Interval ticks since the arrival started. */
  age: number;
}

export interface CommandReply {
  readonly ok: boolean;
  readonly message: string;
}

export interface UfoCoreParts {
  /** Prefixes this runtime's event ids; another script runtime in the same world needs its own. */
  readonly scope: string;
  readonly saucer: Saucer;
  readonly magnet?: Magnet;
  /** Extra onPhase observers, called after the saucer and the magnet. */
  readonly listeners?: readonly PhaseListener[];
}

/** The block under the feet (L0-ufoc-r002, as02). */
export function centreUnder(at: Vector3): Vector3 {
  return { x: Math.floor(at.x), y: Math.floor(at.y) - 1, z: Math.floor(at.z) };
}

/** L0-ufoc-r003 with the §2 cap. */
export function hoverHeight(centreY: number, ceiling: number): number {
  return Math.min(centreY + HOVER_ABOVE, ceiling - CEILING_MARGIN);
}

/** From the middle of the centre block. */
export function horizontalDistance(centre: Readonly<Vector3>, at: Vector3): number {
  return Math.hypot(at.x - (centre.x + 0.5), at.z - (centre.z + 0.5));
}

export function eventOfTags(tags: readonly string[]): string | undefined {
  const tag = tags.find((t) => t.startsWith(EVENT_TAG));
  return tag === undefined ? undefined : tag.slice(EVENT_TAG.length);
}

export const scopeOfEvent = (eventId: string): string => eventId.slice(0, eventId.indexOf("-"));

const fmt = (v: Readonly<Vector3>): string => `${v.x},${v.y},${v.z}`;
const whenText = (next: number | undefined): string => (next === undefined ? "absent" : next === 0 ? "in flight" : String(next));
const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/** Unique per script load across every core in it. */
let eventSeq = 0;

export class UfoCore {
  readonly schedule: UfoSchedule;
  private live: Session | undefined;
  private counter = 0;
  private readonly queue: Array<{ action: UfoAction; invokerId: string | undefined }> = [];
  private readonly listeners: PhaseListener[];
  private ended: { eventId: string; reason: EndReason } | undefined;

  constructor(
    private readonly env: UfoEnv,
    private readonly parts: UfoCoreParts
  ) {
    if (parts.scope === "" || parts.scope.includes("-")) throw new Error(`ufo: scope "${parts.scope}" must be non-empty and free of "-"`);
    this.schedule = new UfoSchedule(env);
    this.listeners = [parts.saucer, ...(parts.magnet === undefined ? [] : [parts.magnet]), ...(parts.listeners ?? [])];
  }

  get scope(): string {
    return this.parts.scope;
  }

  session(): Readonly<Session> | undefined {
    return this.live;
  }

  lastEnd(): { readonly eventId: string; readonly reason: EndReason } | undefined {
    return this.ended;
  }

  pendingCommands(): number {
    return this.queue.length;
  }

  saucerPosition(): Vector3 | undefined {
    try {
      return this.parts.saucer.saucerPosition();
    } catch {
      return undefined;
    }
  }

  // ------------------------------------------------------------- the interval

  /** The body of the one UFO interval (L0-ufoc-ad02): idle, one counter and one branch. */
  tick(): void {
    this.counter++;
    const s = this.live;
    if (this.queue.length > 0) this.drainQueue();
    if (s !== undefined) {
      this.activeStep(s);
      return;
    }
    if (this.live === undefined && this.counter % IDLE_CHECK_TICKS === 0) this.idleCheck();
  }

  private idleCheck(): void {
    if (!this.schedule.isDue()) return;
    const pool = this.env.overworldPlayers();
    if (pool.length === 0) return;
    this.startArrival(this.pick(pool), pool, "schedule");
  }

  /** L0-ufoc-p002, in its fixed order: latch, liveness, advance, saucerStep, magnetStep, downed end. */
  private activeStep(s: Session): void {
    const tick = this.counter;
    const D = this.env.durations;
    s.age++;
    if (s.offLatch !== undefined) {
      const reason = s.offLatch;
      s.offLatch = undefined;
      if (s.magnetOn) {
        s.magnetOn = false;
        this.publish(s, "release");
      }
      if (reason !== "shot") {
        this.endEvent(s, reason);
        return;
      }
    }
    if (s.phase !== "downed" && this.saucerPosition() === undefined) {
      this.env.log(`ufo ${s.eventId}: no valid saucer in ${s.phase} — aborting (L0-ufoc-as04)`);
      s.offLatch ??= "abort";
      return;
    }
    s.phaseTick++;
    if (s.phase === "arrival" && s.phaseTick >= D.arrival) {
      this.enter(s, "magnet");
      s.magnetOn = true;
      this.publish(s, "magnet");
    } else if (s.phase === "magnet" && s.phaseTick >= D.magnet) {
      s.magnetOn = false;
      this.publish(s, "release");
      this.enter(s, "departure");
      this.publish(s, "departure");
    } else if (s.phase === "departure" && s.phaseTick >= D.departure) {
      this.endEvent(s, "departed");
      return;
    }
    this.guard(s, "saucerStep", () => this.parts.saucer.saucerStep(tick));
    if (s.phase === "magnet" && s.magnetOn && this.parts.magnet !== undefined) {
      const magnet = this.parts.magnet;
      this.guard(s, "magnetStep", () => magnet.magnetStep(tick));
    }
    if (s.phase === "downed" && (this.fallFinished() || s.phaseTick >= D.downed)) this.endEvent(s, "downed");
  }

  private enter(s: Session, phase: LivePhase): void {
    s.phase = phase;
    s.phaseTick = 0;
  }

  private fallFinished(): boolean {
    try {
      return this.parts.saucer.fallFinished?.() === true;
    } catch {
      return false;
    }
  }

  private guard(s: Session, what: string, fn: () => void): void {
    try {
      fn();
    } catch (err) {
      this.env.log(`ufo ${s.eventId}: ${what} threw ${errText(err)} — aborting`);
      if (this.live === s) s.offLatch ??= "abort";
    }
  }

  private publish(s: Session, phase: Phase): void {
    const payload: PhasePayload = Object.freeze({
      centre: Object.freeze({ ...s.centre }),
      hoverY: s.hoverY,
      saucerPos: this.saucerPosition(),
      eventId: s.eventId,
    });
    for (const listener of this.listeners) {
      try {
        listener.onPhase(phase, payload);
      } catch (err) {
        this.env.log(`ufo ${s.eventId}: a ${phase} listener threw ${errText(err)} — aborting`);
        if (phase !== "pause" && this.live === s) s.offLatch ??= "abort";
      }
    }
  }

  private pick(pool: UfoPlayer[]): UfoPlayer {
    return pool[Math.min(pool.length - 1, Math.floor(this.env.random() * pool.length))];
  }

  private startArrival(target: UfoPlayer, pool: UfoPlayer[], source: Session["source"]): Session {
    const centre = centreUnder(target.location);
    const s: Session = {
      eventId: `${this.parts.scope}-${this.env.now()}-${++eventSeq}`,
      phase: "arrival",
      phaseTick: 0,
      centre,
      hoverY: hoverHeight(centre.y, this.env.ceiling()),
      targetId: target.id,
      source,
      offLatch: undefined,
      magnetOn: false,
      downedHandled: false,
      age: 0,
    };
    this.live = s;
    this.schedule.markInFlight();
    this.publish(s, "arrival");
    const told = this.notify(s, pool);
    this.env.log(`ufo ${s.eventId}: arrival (${source}) over ${target.name} at ${fmt(centre)}, hover y ${s.hoverY}, notice to ${told}`);
    return s;
  }

  /** L0-ufoc-r005: once, at arrival start, to the Overworld players within NOTICE_RANGE. */
  private notify(s: Session, pool: UfoPlayer[]): number {
    let told = 0;
    for (const p of pool) {
      if (horizontalDistance(s.centre, p.location) > NOTICE_RANGE) continue;
      try {
        p.sendMessage({ rawtext: [{ translate: ARRIVAL_TEXT }] });
        told++;
      } catch (err) {
        this.env.log(`ufo ${s.eventId}: the notice to ${p.name} threw ${errText(err)}`);
      }
    }
    return told;
  }

  private endEvent(s: Session, reason: EndReason): void {
    if (this.live !== s) return;
    this.live = undefined;
    this.ended = { eventId: s.eventId, reason };
    // A shot already started the pause at reportShotDown (L0-adr-ufpc).
    const next = s.downedHandled ? this.schedule.next() : this.schedule.pauseFromNow();
    this.publish(s, "pause");
    this.env.log(`ufo ${s.eventId}: ended (${reason}) after ${s.age} ticks; next arrival at ${whenText(next)}`);
  }

  // ------------------------------------------------------------- the contract

  /** Latched: the release runs at the start of the next UFO tick, never in the caller's stack. */
  requestMagnetOff(reason: OffReason): void {
    if (this.live !== undefined) this.live.offLatch ??= reason;
  }

  /** From `sauc`, inside the Orbital flight step; idempotent per event. */
  reportShotDown(info: { eventId: string; ownerId: string; ownerName: string }): void {
    const s = this.live;
    if (s === undefined || s.eventId !== info.eventId || s.downedHandled) return;
    s.downedHandled = true;
    this.schedule.pauseFromNow();
    s.offLatch ??= "shot";
    this.enter(s, "downed");
    this.publish(s, "downed");
    this.env.log(`ufo ${s.eventId}: shot down by ${info.ownerName}`);
  }

  // ------------------------------------------------------------ world events

  firstJoin(): void {
    if (this.schedule.firstJoin()) this.env.log(`ufo ${this.parts.scope}: first join — first arrival at ${whenText(this.schedule.next())}`);
  }

  /** L0-ufoc-p003 step 3; runs at worldLoad, before the interval starts. */
  worldLoaded(): void {
    if (this.schedule.loaded()) this.env.log(`ufo ${this.parts.scope}: an event was live when the server stopped — next arrival at ${whenText(this.schedule.next())}`);
  }

  /** Stale for this runtime: no event tag, or this runtime's scope with no matching live event. */
  isStale(tags: readonly string[]): boolean {
    const eventId = eventOfTags(tags);
    if (eventId === undefined) return true;
    if (scopeOfEvent(eventId) !== this.parts.scope) return false;
    return eventId !== this.live?.eventId;
  }

  /** L0-ufoc-p003 steps 1–2 over loaded chunks. Another runtime's live saucer is left to it. */
  sweep(dimensions: readonly Dimension[]): { removed: number; untagged: number } {
    let removed = 0;
    let untagged = 0;
    const queries: EntityQueryOptions[] = [{ tags: [UFO_TAG] }, { families: [UFO_FAMILY] }];
    for (const dim of dimensions) {
      const seen = new Set<string>();
      for (const query of queries) {
        for (const e of dim.getEntities(query)) {
          if (e?.isValid !== true || seen.has(e.id)) continue;
          seen.add(e.id);
          if (this.isStale(e.getTags())) {
            e.remove();
            removed++;
          }
        }
      }
      if (this.live !== undefined) continue;
      for (const e of dim.getEntities({ tags: [IRON_TAG] })) {
        if (e?.isValid === true && e.removeTag(IRON_TAG)) untagged++;
      }
    }
    if (removed + untagged > 0) this.env.log(`ufo ${this.parts.scope}: load sweep removed ${removed} UFO entit${removed === 1 ? "y" : "ies"}, untagged ${untagged}`);
    return { removed, untagged };
  }

  /** L0-xasm17: the lazy half of the sweep, for chunks that load after worldLoad. */
  entityLoaded(entity: Entity): void {
    if (!entity.isValid) return;
    if (this.live === undefined && entity.hasTag(IRON_TAG)) entity.removeTag(IRON_TAG);
    if (entity.typeId !== SAUCER_ID && !entity.hasTag(UFO_TAG)) return;
    const tags = entity.getTags();
    if (!this.isStale(tags)) return;
    const id = entity.id;
    entity.remove();
    this.env.log(`ufo ${this.parts.scope}: removed stale ${SAUCER_ID === entity.typeId ? "saucer" : "UFO entity"} ${id} on load (event ${eventOfTags(tags) ?? "none"})`);
  }

  // ---------------------------------------------------------------- commands

  /**
   * /andrew:ufo (L0-ufoc-p004). Runs in the command's read-only callback: it
   * decides the reply from memory and queues the action, which the next
   * interval tick carries out, so every UFO world change stays in the interval.
   */
  command(action: UfoAction, invokerId?: string): CommandReply {
    switch (action) {
      case "come": {
        if (this.live !== undefined || this.queue.some((q) => q.action === "come")) return { ok: false, message: "A UFO is already in the sky." };
        let pool: UfoPlayer[] | undefined;
        try {
          pool = this.env.overworldPlayers();
        } catch {
          pool = undefined;
        }
        if (pool !== undefined && pool.length === 0) return { ok: false, message: "No player in the Overworld for the UFO to come to." };
        this.queue.push({ action, invokerId });
        return { ok: true, message: "A UFO is coming." };
      }
      case "stop":
        if (this.live === undefined) return { ok: true, message: "No UFO." };
        this.queue.push({ action, invokerId });
        return { ok: true, message: "The UFO is removed; what it held falls." };
      case "enable":
        this.queue.push({ action, invokerId });
        return { ok: true, message: "The UFO event is on in this world." };
      case "disable":
        this.queue.push({ action, invokerId });
        return { ok: true, message: "The UFO event is off in this world." };
    }
  }

  private drainQueue(): void {
    for (const { action, invokerId } of this.queue.splice(0)) {
      try {
        this.execute(action, invokerId);
      } catch (err) {
        this.env.log(`ufo ${this.parts.scope}: ${action} threw ${errText(err)}`);
      }
    }
  }

  private execute(action: UfoAction, invokerId: string | undefined): void {
    switch (action) {
      case "come": {
        if (this.live !== undefined) {
          this.env.log(`ufo ${this.parts.scope}: come refused — ${this.live.eventId} is live`);
          return;
        }
        const pool = this.env.overworldPlayers();
        // L0-ufoc-as01: the invoker when they can be a target, else anyone in the Overworld.
        const target = pool.find((p) => p.id === invokerId) ?? (pool.length > 0 ? this.pick(pool) : undefined);
        if (target === undefined) {
          this.env.log(`ufo ${this.parts.scope}: come refused — no player in the Overworld`);
          return;
        }
        this.startArrival(target, pool, "command");
        return;
      }
      case "stop":
        this.requestMagnetOff("stop");
        return;
      case "disable":
        this.schedule.setEnabled(false);
        this.requestMagnetOff("stop");
        this.env.log(`ufo ${this.parts.scope}: disabled in this world`);
        return;
      case "enable":
        this.schedule.setEnabled(true);
        this.env.log(`ufo ${this.parts.scope}: enabled in this world; next arrival at ${whenText(this.schedule.next())}`);
        return;
    }
  }
}

/** The slice of `System` the core needs; `system` satisfies it. */
export interface IntervalHost {
  runInterval(callback: () => void, tickInterval?: number): number;
  clearRun(runId: number): void;
}

/** The one UFO interval (C-5d, L0-ufoc-ad02). Returns its stopper. */
export function runCore(core: UfoCore, host: IntervalHost): () => void {
  const id = host.runInterval(() => core.tick(), 1);
  return () => host.clearRun(id);
}
