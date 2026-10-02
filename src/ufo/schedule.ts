// The UFO's only durable state (C-23, L0-ufoc-ent1): when the next arrival is
// due, in epoch ms, and whether the event is on in this world. Everything about
// a live event stays in memory (event.ts).

import type { UfoEnv } from "./env";

export const NEXT_MS = "andrew:ufo_next_ms";
export const ENABLED = "andrew:ufo_enabled";

/** L0-ufoc-ad03: written at arrival start; no `Date.now()` value and no "absent" reads as 0. */
export const IN_FLIGHT = 0;

type ScheduleEnv = Pick<UfoEnv, "store" | "now" | "random" | "pauseMs" | "firstMinMs" | "firstMaxMs">;

/** `undefined`: no first join seen yet; `IN_FLIGHT`: an event is live; otherwise the due time. */
export type NextArrival = number | undefined;

export class UfoSchedule {
  constructor(private readonly env: ScheduleEnv) {}

  next(): NextArrival {
    const raw = this.env.store.get(NEXT_MS);
    return typeof raw === "number" && Number.isFinite(raw) ? raw : undefined;
  }

  /** Absent means on (UFO §9). */
  enabled(): boolean {
    return this.env.store.get(ENABLED) !== false;
  }

  /** L0-xasm14: the first join of the world draws the first window; later joins change nothing. */
  firstJoin(): boolean {
    if (this.next() !== undefined) return false;
    const r = Math.min(1, Math.max(0, this.env.random()));
    const at = this.env.now() + this.env.firstMinMs + Math.round(r * (this.env.firstMaxMs - this.env.firstMinMs));
    this.env.store.set(NEXT_MS, at);
    return true;
  }

  /**
   * The idle check of L0-ufoc-p001: one store read while the time is not due,
   * one clock read, and the flag only once it is.
   */
  isDue(): boolean {
    const next = this.next();
    if (next === undefined || next === IN_FLIGHT) return false;
    if (this.env.now() < next) return false;
    return this.enabled();
  }

  markInFlight(): void {
    this.env.store.set(NEXT_MS, IN_FLIGHT);
  }

  /** Every end of an event: departure, shoot-down, stop, abort, restart (r001). */
  pauseFromNow(): number {
    const at = this.env.now() + this.env.pauseMs;
    this.env.store.set(NEXT_MS, at);
    return at;
  }

  /** L0-ufoc-p003 step 3: an event that was live when the server stopped is rescheduled from now. */
  loaded(): boolean {
    if (this.next() !== IN_FLIGHT) return false;
    this.pauseFromNow();
    return true;
  }

  /** r006: re-enabling never drops a saucer in the same second, so an overdue time moves 15 min out. */
  setEnabled(on: boolean): void {
    this.env.store.set(ENABLED, on);
    if (!on) return;
    const next = this.next();
    if (next !== undefined && next !== IN_FLIGHT && next < this.env.now()) this.pauseFromNow();
  }
}
