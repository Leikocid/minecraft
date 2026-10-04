// The UFO magnet (L0-magn), `magn`'s side of L0-adr-ufpc: onPhase("magnet")
// picks and materialises at most ELEMENT_LIMIT elements (magnet-select.ts),
// every magnetStep holds them and pulls players (magnet-hold.ts), iron that
// spawns near the saucer joins beyond the limit (L0-magn-rexm), and
// onPhase("release") lets everything go in one tick (L0-magn-prel). It holds
// nothing across a restart (C-23); the core's sweep strips the held tag.
// Engine objects come in through MagnetEnv, so node tests run it over fakes.

import type { Dimension, Entity, EntitySpawnAfterEvent, ItemStack, Vector3 } from "@minecraft/server";
import { isLegendaryWeaponStack } from "../legendary/registry";
import { IRON_TAG, type Magnet, type Phase, type PhasePayload } from "./event";
import { isMagneticStack } from "./iron";
import { EXEMPT, type HeldElement, type HeldPlayer, type HoldReport, distance, holdStep } from "./magnet-hold";
import { HOLDER, type MagnetDimension, type MagnetHost, type MagnetSelection, type Zone, magnetOn } from "./magnet-select";

/** UFO §5: a drop within this many blocks of the hover point (3-D) is pulled beyond the limit. */
export const EXEMPT_RADIUS = 12;

const ITEM = "minecraft:item";

interface Subscribable<E> {
  subscribe(callback: (event: E) => void): (event: E) => void;
  unsubscribe(callback: (event: E) => void): void;
}

export interface MagnetEnv {
  /** The scan, the drops and every element are in the Overworld. */
  overworld(): MagnetDimension & Pick<Dimension, "isChunkLoaded">;
  /**
   * The Overworld's players; the hold skips the invalid and the dead. A product
   * pack reads a SimulatedPlayer as undefined, so GameTest binds its own players
   * here (L0-ufoc-ad01).
   */
  players(): Iterable<HeldPlayer | undefined>;
  /** Read only inside magnetStep, after saucerStep (L0-adr-ufpc). */
  saucerPosition(): Vector3 | undefined;
  /** world.afterEvents.entitySpawn; subscribed only while the magnet is on (L0-magn-adex). */
  readonly spawns: Subscribable<EntitySpawnAfterEvent>;
  readonly host: MagnetHost;
  isLegendaryWeapon?(stack: ItemStack): boolean;
}

/** L0-magn-eelm's session, read-only, for diagnostics and GameTest. */
export interface MagnetView {
  readonly eventId: string;
  readonly zone: Zone;
  readonly selection: MagnetSelection;
  readonly elements: readonly Readonly<HeldElement>[];
  readonly slots: number;
  readonly exempt: number;
  readonly steps: number;
  readonly last: (HoldReport & { readonly tick: number }) | undefined;
}

export interface MagnetSummary {
  readonly eventId: string;
  readonly reason: string;
  readonly steps: number;
  readonly held: number;
  readonly exempt: number;
  readonly maxPulled: number;
  readonly stepMsMean: number;
  readonly stepMsMax: number;
}

interface Session {
  readonly eventId: string;
  readonly dim: MagnetDimension & Pick<Dimension, "isChunkLoaded">;
  readonly zone: Zone;
  readonly selection: MagnetSelection;
  readonly elements: HeldElement[];
  /** Every entity that was ever an element or came from the extraction: the listener ignores them. */
  readonly known: Set<string>;
  /** Holders carry IRON_TAG; untagged at the release. */
  readonly tagged: Entity[];
  readonly pending: { entity: Entity; at: Vector3 }[];
  readonly listener: (event: EntitySpawnAfterEvent) => void;
  slots: number;
  exempt: number;
  steps: number;
  stepMs: number;
  stepMsMax: number;
  maxPulled: number;
  errors: number;
  last: (HoldReport & { tick: number }) | undefined;
}

const fmt = (v: Vector3): string => `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;

export class UfoMagnet implements Magnet {
  private live: Session | undefined;
  private summary: MagnetSummary | undefined;
  private readonly isLegendaryWeapon: (stack: ItemStack) => boolean;

  constructor(private readonly env: MagnetEnv) {
    this.isLegendaryWeapon = env.isLegendaryWeapon ?? isLegendaryWeaponStack;
  }

  onPhase(phase: Phase, payload: PhasePayload): void {
    if (phase === "magnet") {
      this.release("superseded");
      this.start(payload);
    } else if (phase === "release" || phase === "pause") {
      this.release(phase);
    }
  }

  magnetStep(tick: number): void {
    const s = this.live;
    if (s === undefined) return;
    const saucer = this.env.saucerPosition();
    if (saucer === undefined) return;
    const host = this.env.host;
    const start = host.now();
    this.admit(s, saucer);
    const dim = s.dim;
    const report = holdStep({
      saucer,
      zone: s.zone,
      tick: s.steps,
      slots: s.slots,
      players: this.env.players(),
      elements: s.elements,
      isLegendaryWeapon: this.isLegendaryWeapon,
      isLoaded: (at) => dim.isChunkLoaded(at),
    });
    if (report.errors.length > 0 && s.errors++ < 3) host.log(`ufo magnet ${s.eventId}: hold step ${tick}: ${report.errors.join(" | ")}`);
    const ms = host.now() - start;
    s.steps++;
    s.stepMs += ms;
    s.stepMsMax = Math.max(s.stepMsMax, ms);
    s.maxPulled = Math.max(s.maxPulled, report.pulled.length);
    s.last = { ...report, tick };
  }

  view(): MagnetView | undefined {
    const s = this.live;
    if (s === undefined) return undefined;
    return { eventId: s.eventId, zone: s.zone, selection: s.selection, elements: [...s.elements], slots: s.slots, exempt: s.exempt, steps: s.steps, last: s.last };
  }

  lastSummary(): MagnetSummary | undefined {
    return this.summary;
  }

  private start(p: PhasePayload): void {
    const host = this.env.host;
    const dim = this.env.overworld();
    const selection = magnetOn(dim, p.centre, p.hoverY, host, { isLegendaryWeapon: this.isLegendaryWeapon });
    const elements: HeldElement[] = selection.elements.map((e) => ({ entity: e.entity, cls: e.cls, from: e.from, origin: e.origin, slot: e.slot, arrived: false }));
    const known = new Set<string>([...selection.spawned, ...elements.map((e) => e.entity.id)]);
    const pending: Session["pending"] = [];
    // An after-event only reads: the drop joins at the next magnetStep, against that tick's saucer.
    const listener = (event: EntitySpawnAfterEvent): void => {
      const e = event.entity;
      if (e === undefined || !e.isValid || e.typeId !== ITEM || known.has(e.id)) return;
      pending.push({ entity: e, at: e.location });
    };
    this.live = {
      eventId: p.eventId,
      dim,
      zone: selection.zone,
      selection,
      elements,
      known,
      tagged: elements.filter((e) => e.cls === HOLDER).map((e) => e.entity),
      pending,
      listener: this.env.spawns.subscribe(listener),
      slots: elements.length,
      exempt: 0,
      steps: 0,
      stepMs: 0,
      stepMsMax: 0,
      maxPulled: 0,
      errors: 0,
      last: undefined,
    };
  }

  /** L0-magn-rexm: iron or a legendary weapon that spawned within EXEMPT_RADIUS of the saucer becomes a class X element. */
  private admit(s: Session, saucer: Vector3): void {
    for (const { entity, at } of s.pending.splice(0)) {
      if (!entity.isValid || s.known.has(entity.id)) continue;
      s.known.add(entity.id);
      if (distance(at, saucer) > EXEMPT_RADIUS) continue;
      const stack = entity.getComponent("minecraft:item")?.itemStack;
      if (stack === undefined || !isMagneticStack(stack, this.isLegendaryWeapon)) continue;
      s.elements.push({ entity, cls: EXEMPT, from: stack.typeId, origin: at, slot: s.slots++, arrived: false });
      s.exempt++;
    }
  }

  /** L0-magn-prel: no impulse and no teleport — everything keeps the zero velocity of the last step and falls. */
  private release(reason: string): void {
    const s = this.live;
    if (s === undefined) return;
    this.live = undefined;
    this.env.spawns.unsubscribe(s.listener);
    for (const e of s.tagged) {
      try {
        if (e.isValid) e.removeTag(IRON_TAG);
      } catch {
        // The core's load sweep strips a tag this misses.
      }
    }
    const held = s.elements.length;
    s.elements.length = 0;
    s.pending.length = 0;
    this.summary = {
      eventId: s.eventId,
      reason,
      steps: s.steps,
      held,
      exempt: s.exempt,
      maxPulled: s.maxPulled,
      stepMsMean: s.steps > 0 ? s.stepMs / s.steps : 0,
      stepMsMax: s.stepMsMax,
    };
    this.env.host.log(
      `ufo magnet ${s.eventId}: released (${reason}) at ${fmt(s.zone.centre)} after ${s.steps} hold steps: ${held} element(s) held (${s.exempt} exempt), ` +
        `up to ${s.maxPulled} player(s) pulled, step mean ${this.summary.stepMsMean.toFixed(3)} ms, max ${s.stepMsMax} ms`
    );
  }
}
