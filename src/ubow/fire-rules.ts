// The Underwater Bow's two fires (spec §1; L0-uwbw-r002, L0-uwbw-esfr, L0-xasm38), with no engine import:
// tests/ubow-fire.test.mjs runs it under node. fire.ts is the engine side.

import { UNDERWATER_BOW } from "../legendary/registry";

export const TICKS_PER_SECOND = 20;
/** §1: an ordinary hit sets the target on fire for this long. Water may put it out. */
export const NORMAL_FIRE_SECONDS = 2;
/** §1: Super Fire burns this long, in water too. */
export const SUPER_FIRE_SECONDS = 5;
/** probe-ubow row 4: vanilla burning deals 1.00 every 20 ticks; Super Fire burns at the same rate. */
export const BURN_INTERVAL_TICKS = 20;
export const BURN_DAMAGE = 1;
/** An arrow of this bow that has hurt nobody after this long is forgotten. */
export const ARROW_MEMORY_TICKS = 600;
/** Flame and smoke at the body every this many ticks while the engine shows no flames (in water, rain). */
export const PARTICLE_EVERY_TICKS = 5;
/** Lost flames are put back at most this often: setOnFire is refused in rain and on fire-immune targets. */
export const FLAME_RETRY_TICKS = 10;

export const ARROW_ID = "minecraft:arrow";

export const secondsToTicks = (seconds: number): number => Math.max(0, Math.round(seconds * TICKS_PER_SECOND));

/** Two fires on one target never add: the one with more time left is the one that burns on (L0-xasm38). */
export const mergeRemaining = (currentTicks: number, incomingTicks: number): number => Math.max(currentTicks, incomingTicks, 0);

/**
 * How long a normal hit sets the vanilla fire for, in ticks, or undefined when the target already burns at least that
 * long — a Flame arrow's 5 s or a Super Fire window stays as it is and is never cut down to 2 s.
 */
export function normalIgniteTicks(fireTicksLeft: number, superTicksLeft: number, seconds = NORMAL_FIRE_SECONDS): number | undefined {
  const want = secondsToTicks(seconds);
  return want > mergeRemaining(fireTicksLeft, superTicksLeft) ? want : undefined;
}

/** What entitySpawn knows about a new entity: its type and, for a projectile, its owner. */
export interface SpawnedShot {
  typeId: string;
  ownerIsPlayer: boolean;
  /** The owner's main-hand item id: a bow is drawn from the main hand only. */
  mainHand: string | undefined;
  /** The held copy is a marked one whose generation was superseded (R-lgnd-005). */
  stale: boolean;
}

/** An arrow this bow shot: a vanilla arrow, owned by a player holding a live Underwater Bow in the main hand. */
export const isUnderwaterBowArrow = (s: SpawnedShot): boolean =>
  s.typeId === ARROW_ID && s.ownerIsPlayer && s.mainHand === UNDERWATER_BOW.itemId && !s.stale;

export type NormalHitSkip = "cause" | "no-damage" | "not-ours";

/** An after-event hurt that is an ordinary hit of this bow's arrow: it landed (damage above 0) and the arrow is known. */
export function normalHitSkip(cause: string, damage: number, arrowKnown: boolean): NormalHitSkip | undefined {
  if (cause !== "projectile") return "cause";
  if (!(damage > 0)) return "no-damage";
  if (!arrowKnown) return "not-ours";
  return undefined;
}

/**
 * Vanilla burning on a Super Fire target is cancelled for the window, so the burn stays 1 HP a second instead of two
 * fires' worth. The pack's own scripted burn and every other fire cause (a fire block, lava) pass.
 */
export const suppressVanillaBurn = (cause: string, scripted: boolean, superBurning: boolean): boolean =>
  cause === "fireTick" && !scripted && superBurning;

/** The arrows this bow shot, by entity id, until they hurt something or are forgotten. */
export class ArrowBook {
  private readonly arrows = new Map<string, { shooterId: string; bornTick: number }>();

  remember(arrowId: string, shooterId: string, now: number): void {
    this.sweep(now);
    this.arrows.set(arrowId, { shooterId, bornTick: now });
  }

  /** The arrow's shooter, once: a claimed arrow is no longer known. */
  claim(arrowId: string | undefined): string | undefined {
    if (arrowId === undefined) return undefined;
    const rec = this.arrows.get(arrowId);
    if (rec === undefined) return undefined;
    this.arrows.delete(arrowId);
    return rec.shooterId;
  }

  forget(arrowId: string): void {
    this.arrows.delete(arrowId);
  }

  has(arrowId: string | undefined): boolean {
    return arrowId !== undefined && this.arrows.has(arrowId);
  }

  sweep(now: number): void {
    for (const [id, rec] of this.arrows) {
      if (now - rec.bornTick > ARROW_MEMORY_TICKS) this.arrows.delete(id);
    }
  }

  get size(): number {
    return this.arrows.size;
  }
}

/** A before-event pairing whose after-event has not come within this many ticks did not land. */
export const LANDING_TICKS = 2;

/**
 * The arrow is readable in beforeEvents.entityHurt and already removed by the after-events (probe-ubow row 1), so the
 * before-event pairs target and arrow and the after-event, which only comes for a hit that landed, takes the pairing.
 */
export class LandingBook {
  private readonly pending = new Map<string, { arrowId: string; tick: number }>();

  expect(targetId: string, arrowId: string, now: number): void {
    this.pending.set(targetId, { arrowId, tick: now });
  }

  take(targetId: string, now: number): string | undefined {
    const rec = this.pending.get(targetId);
    if (rec === undefined) return undefined;
    this.pending.delete(targetId);
    return now - rec.tick <= LANDING_TICKS ? rec.arrowId : undefined;
  }

  get size(): number {
    return this.pending.size;
  }
}

export interface SuperFire {
  startTick: number;
  untilTick: number;
  /** The next 1 HP burn; burns run while nextBurnTick ≤ untilTick. */
  nextBurnTick: number;
  burns: number;
}

export interface IgniteResult {
  fire: SuperFire;
  /** A live record was there already: its window was stretched, no second record was made. */
  refreshed: boolean;
}

/**
 * Super Fire records by target id (L0-uwbw-esfr). A window of N ticks burns at start+20, +40, …, start+N: 5 s gives
 * exactly 5 burns, the first one past the 10-tick hurt window the hit that lit it opens.
 */
export class SuperFireBook {
  private readonly fires = new Map<string, SuperFire>();

  /** Lights or refreshes: a live record keeps its burn cadence and takes the later end, so two never stack. */
  ignite(targetId: string, now: number, ticks: number): IgniteResult {
    const live = this.fires.get(targetId);
    if (live !== undefined && live.nextBurnTick <= live.untilTick) {
      live.untilTick = Math.max(live.untilTick, now + ticks);
      return { fire: live, refreshed: true };
    }
    const fire: SuperFire = { startTick: now, untilTick: now + ticks, nextBurnTick: now + BURN_INTERVAL_TICKS, burns: 0 };
    this.fires.set(targetId, fire);
    return { fire, refreshed: false };
  }

  get(targetId: string): SuperFire | undefined {
    return this.fires.get(targetId);
  }

  /** From the lighting tick through the last burn tick, inclusive. */
  isBurning(targetId: string, now: number): boolean {
    const fire = this.fires.get(targetId);
    return fire !== undefined && now <= fire.untilTick;
  }

  ticksLeft(targetId: string, now: number): number {
    const fire = this.fires.get(targetId);
    return fire === undefined ? 0 : Math.max(0, fire.untilTick - now);
  }

  /** Whether `now` is a burn tick for this target; a true answer moves its cadence on by one burn. */
  takeBurn(targetId: string, now: number): boolean {
    const fire = this.fires.get(targetId);
    if (fire === undefined || now < fire.nextBurnTick || fire.nextBurnTick > fire.untilTick) return false;
    fire.nextBurnTick += BURN_INTERVAL_TICKS;
    fire.burns++;
    return true;
  }

  /** Whether the record has no burn left; it is not dropped here. */
  isSpent(targetId: string): boolean {
    const fire = this.fires.get(targetId);
    return fire === undefined || fire.nextBurnTick > fire.untilTick;
  }

  drop(targetId: string): SuperFire | undefined {
    const fire = this.fires.get(targetId);
    this.fires.delete(targetId);
    return fire;
  }

  ids(): string[] {
    return [...this.fires.keys()];
  }

  get size(): number {
    return this.fires.size;
  }
}

export type SuperVisual = { kind: "flames"; seconds: number } | { kind: "particles" } | { kind: "none" };

/**
 * The look of Super Fire this tick. Out of water the engine's own flames are put back when they are gone, never for
 * longer than the window's whole seconds, so the vanilla fire never outlasts Super Fire by this module's doing. While
 * the engine shows no flames (water puts them out at once, probe-ubow row 4), flame particles stand in.
 */
export function superVisual(inWater: boolean, fireTicks: number, ticksLeft: number, age: number): SuperVisual {
  if (ticksLeft <= 0 || fireTicks > 0) return { kind: "none" };
  const seconds = Math.floor(ticksLeft / TICKS_PER_SECOND);
  if (!inWater && seconds > 0 && age % FLAME_RETRY_TICKS === 0) return { kind: "flames", seconds };
  return age % PARTICLE_EVERY_TICKS === 0 ? { kind: "particles" } : { kind: "none" };
}
