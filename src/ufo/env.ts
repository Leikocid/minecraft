// The UFO core's view of the world (L0-ufoc-ad01): a clock, the phase lengths,
// the players it may target, a random source, the durable store and the
// Overworld ceiling. The product binds the engine here; GameTest and the
// self-check bind a test clock, their own players and a scoped store, because a
// product pack reads a SimulatedPlayer as undefined (UFO §11).
// Engine objects come in as arguments, so node tests load this module with no
// @minecraft/server stub.

import type { Player, RawMessage, Vector3 } from "@minecraft/server";

/** Phase lengths in interval ticks; `release` is instant and `pause` is the schedule's. */
export interface UfoDurations {
  readonly arrival: number;
  readonly magnet: number;
  readonly departure: number;
  readonly downed: number;
}

/** UFO §2 and §8 at 20 ticks a second: 20 s, 60 s, 15 s, and the 3 s fall. */
export const PHASE_TICKS: UfoDurations = { arrival: 400, magnet: 1200, departure: 300, downed: 60 };

/** UFO §2: the next arrival comes exactly 15 min after a departure or a shoot-down. */
export const PAUSE_MS = 900_000;
/** UFO §2: the first arrival comes U[10, 20] min after the first join. */
export const FIRST_MIN_MS = 600_000;
export const FIRST_MAX_MS = 1_200_000;

export const OVERWORLD = "minecraft:overworld";

/** What the core reads of a player: who, where, and a way to tell them. */
export interface UfoPlayer {
  readonly id: string;
  readonly name: string;
  readonly location: Vector3;
  sendMessage(message: RawMessage): void;
}

/** The world dynamic properties the schedule lives in (L0-ufoc-ent1). */
export interface UfoStore {
  get(key: string): unknown;
  set(key: string, value: number | boolean | undefined): void;
}

export interface UfoEnv {
  /** Epoch ms; `Date.now` in the product (C-21). */
  now(): number;
  readonly durations: UfoDurations;
  readonly pauseMs: number;
  readonly firstMinMs: number;
  readonly firstMaxMs: number;
  /** Valid, live players in the Overworld (L0-ufoc-r002). */
  overworldPlayers(): UfoPlayer[];
  /** [0, 1]; 1 is accepted and treated as the top of every range. */
  random(): number;
  readonly store: UfoStore;
  /** The Overworld `heightRange.max`. */
  ceiling(): number;
  log(msg: string): void;
}

/**
 * L0-ufoc-r002 candidates: valid, in the Overworld, alive. A product pack gets
 * `undefined` where a SimulatedPlayer stands, and a dead player stays listed
 * with health 0 until it respawns.
 */
export function overworldCandidates(players: Iterable<Player | undefined>): Player[] {
  const out: Player[] = [];
  for (const p of players) {
    if (p === undefined || !p.isValid) continue;
    if (p.dimension.id !== OVERWORLD) continue;
    const health = p.getComponent("minecraft:health")?.currentValue;
    if (health !== undefined && health <= 0) continue;
    out.push(p);
  }
  return out;
}

/** The slice of `World` the product env uses; `world` satisfies it. */
export interface EnvWorld {
  getAllPlayers(): Player[];
  getDimension(id: string): { readonly heightRange: { readonly max: number } };
  getDynamicProperty(key: string): unknown;
  setDynamicProperty(key: string, value?: number | boolean): void;
}

export function worldStore(world: Pick<EnvWorld, "getDynamicProperty" | "setDynamicProperty">): UfoStore {
  return {
    get: (key) => world.getDynamicProperty(key),
    set: (key, value) => world.setDynamicProperty(key, value),
  };
}

export function productEnv(world: EnvWorld, log: (msg: string) => void): UfoEnv {
  return {
    now: () => Date.now(),
    durations: PHASE_TICKS,
    pauseMs: PAUSE_MS,
    firstMinMs: FIRST_MIN_MS,
    firstMaxMs: FIRST_MAX_MS,
    overworldPlayers: () => overworldCandidates(world.getAllPlayers()),
    random: () => Math.random(),
    store: worldStore(world),
    ceiling: () => world.getDimension("overworld").heightRange.max,
    log,
  };
}
