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
  /**
   * Generation of the instance. The stack is live only while this equals the
   * world ledger's generation for `id` (R-lgnd-005). Absent on stacks and
   * tokens written before generations existed, and read as 0 there.
   */
  gen: number;
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
 * What a craft should do with the resulting item.
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

/**
 * What the gate does with a craft token that reached a player's inventory
 * (AD-lgnd-08): swap it for the marked weapon and spend the world's craft,
 * swap it for the ingredients, or — where craftDecision ignores the result —
 * swap it for an ordinary unmarked weapon. A token is never left in place.
 */
export type TokenDecision = "claim" | "refund" | "unwrap";

export function tokenDecision(crafted: boolean, gameMode: GameMode): TokenDecision {
  const decision = craftDecision({ crafted, gameMode, marked: false });
  return decision === "ignore" ? "unwrap" : decision;
}

/** Ticks remaining until `until`, clamped to zero — never negative. */
export function cooldownRemaining(now: number, until: number): number {
  const remaining = until - now;
  return remaining > 0 ? remaining : 0;
}

function isMarkOrigin(value: unknown): value is MarkOrigin {
  return value === "craft" || value === "admin";
}

/** A generation is a non-negative integer; anything else is a malformed mark. */
export function isGen(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

/** Reads a `Mark` out of an already-parsed value, or undefined if it is malformed. */
export function markFromValue(value: unknown): Mark | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined;
  }

  const candidate = value as Record<string, unknown>;
  const { origin, owner, id, gen, ownerName } = candidate;

  if (!isMarkOrigin(origin) || typeof owner !== "string" || typeof id !== "string") {
    return undefined;
  }
  if (gen !== undefined && !isGen(gen)) {
    return undefined;
  }
  if (ownerName !== undefined && typeof ownerName !== "string") {
    return undefined;
  }

  const mark: Mark = { origin, owner, id, gen: gen ?? 0 };
  return ownerName === undefined ? mark : { ...mark, ownerName };
}

/** Parses a `Mark` from JSON, returning undefined for any malformed input. */
export function parseMark(json: string): Mark | undefined {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    return undefined;
  }
  return markFromValue(value);
}

export function serializeMark(mark: Mark): string {
  return JSON.stringify(mark);
}

/** One lost instance owed to a player who could not take it at the time (L0-lgnd-ent4). */
export interface OwedEntry {
  mark: Mark;
  reason: string;
}

/** Return target's player id -> the instances owed to them, oldest first. */
export type OwedLedger = Record<string, OwedEntry[]>;

/**
 * Parses the stored owed ledger. A value from before owed lists — one
 * serialized mark per player — reads as a list of one. Malformed entries are
 * dropped, never the whole ledger.
 */
export function parseOwed(raw: unknown): OwedLedger {
  if (typeof raw !== "string") {
    return {};
  }
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const owed: OwedLedger = {};
  for (const [target, stored] of Object.entries(value as Record<string, unknown>)) {
    const entries: OwedEntry[] = [];
    if (typeof stored === "string") {
      const mark = parseMark(stored);
      if (mark !== undefined) {
        entries.push({ mark, reason: "lost" });
      }
    } else if (Array.isArray(stored)) {
      for (const item of stored as unknown[]) {
        const fields = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
        const mark = markFromValue(fields.mark);
        if (mark !== undefined) {
          entries.push({ mark, reason: typeof fields.reason === "string" ? fields.reason : "lost" });
        }
      }
    }
    if (entries.length > 0) {
      owed[target] = entries;
    }
  }
  return owed;
}

export function serializeOwed(owed: OwedLedger): string {
  return JSON.stringify(owed);
}

/**
 * `owed` with `entry` appended for `target`. An older entry for the same
 * instance is replaced: only its newest generation can be live.
 */
export function withOwed(owed: OwedLedger, target: string, entry: OwedEntry): OwedLedger {
  const kept = (owed[target] ?? []).filter((e) => e.mark.id !== entry.mark.id);
  return { ...owed, [target]: [...kept, entry] };
}

/** `owed` without `target`'s entry for exactly this instance and generation. */
export function withoutOwed(owed: OwedLedger, target: string, mark: Mark): OwedLedger {
  const kept = (owed[target] ?? []).filter((e) => e.mark.id !== mark.id || e.mark.gen !== mark.gen);
  const next = { ...owed };
  if (kept.length > 0) {
    next[target] = kept;
  } else {
    delete next[target];
  }
  return next;
}
