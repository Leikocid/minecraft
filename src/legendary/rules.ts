// Pure decision logic shared by every legendary item — no engine calls, values
// in and values out. Kept apart from state.ts so node tests can bundle this file
// with esbuild without stubbing @minecraft/server: the only reference to that
// module below is the GameMode *type*, which import-type erases at compile
// time and leaves no runtime import for esbuild to resolve.

import type { GameMode } from "@minecraft/server";

/** The standard legendary cooldown: 30 seconds at 20 ticks/second (spec §8). */
export const COOLDOWN_TICKS = 600;

export type MarkOrigin = "craft" | "admin";

/** The durable instance mark carried by a legendary ItemStack (Q-006). */
export interface Mark {
  origin: MarkOrigin;
  owner: string;
  id: string;
  /** Craft-time only: the crafter's nickname, for chat messages. */
  ownerName?: string;
}

export type CraftDecision = "ignore" | "claim" | "refund";

export interface CraftDecisionInput {
  /** Whether the world's one-per-world craft flag is already set. */
  crafted: boolean;
  gameMode: GameMode;
  /** Whether the resulting ItemStack already carries an instance mark. */
  marked: boolean;
}

/**
 * What a survival-craft-shaped event should do with the resulting item.
 *
 * Creative/Spectator and already-marked results are left alone (Q-015):
 * admin/dev copies and existing instances never trigger the one-per-world
 * gate. An unmarked result claims the world flag on first success, or is
 * refunded on every subsequent attempt (Q-008).
 */
export function craftDecision({ crafted, gameMode, marked }: CraftDecisionInput): CraftDecision {
  if (gameMode === "Creative" || gameMode === "Spectator") {
    return "ignore";
  }
  if (marked) {
    return "ignore";
  }
  return crafted ? "refund" : "claim";
}

/** Ticks remaining until `until`, clamped to zero — never negative. */
export function cooldownRemaining(now: number, until: number): number {
  const remaining = until - now;
  return remaining > 0 ? remaining : 0;
}

function isMarkOrigin(value: unknown): value is MarkOrigin {
  return value === "craft" || value === "admin";
}

/** Parses a `Mark` from JSON, returning undefined for any malformed input. */
export function parseMark(json: string): Mark | undefined {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return undefined;
  }

  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const { origin, owner, id, ownerName } = candidate;

  if (!isMarkOrigin(origin) || typeof owner !== "string" || typeof id !== "string") {
    return undefined;
  }
  if (ownerName !== undefined && typeof ownerName !== "string") {
    return undefined;
  }

  return ownerName === undefined ? { origin, owner, id } : { origin, owner, id, ownerName };
}

export function serializeMark(mark: Mark): string {
  return JSON.stringify(mark);
}
