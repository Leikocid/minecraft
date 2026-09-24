// Per-ability timers on the player: the cooldown (Q-009) and the busy window
// an ability holds while its effect is still in flight.
//
// This module only keeps the clocks. The ability owner decides when an
// activation succeeded and only then calls startCooldown() [src: KV L0 ADR-017].

import type { Player } from "@minecraft/server";
import { busyKey, cooldownKey, defForAbility } from "./registry";
import { COOLDOWN_TICKS, cooldownRemaining } from "./rules";

const MS_PER_TICK = 50;

/**
 * Real milliseconds, not `world.getAbsoluteTime()`: that is the world's
 * time-of-day counter and stops with `dodaylightcycle false` or an empty
 * server, so a deadline armed against it never expires (measured on BDS
 * 1.26.51.1). Not `system.currentTick` either — it restarts at zero with the
 * script engine and a stored deadline would outlive its clock.
 */
function nowMs(): number {
  return Date.now();
}

function readMs(player: Player, key: string): number {
  const raw = player.getDynamicProperty(key);
  return typeof raw === "number" ? raw : 0;
}

/** Milliseconds until `abilityKey` is off cooldown for `player`, clamped to zero. */
export function remainingMs(player: Player, abilityKey: string): number {
  return cooldownRemaining(nowMs(), readMs(player, cooldownKey(abilityKey)));
}

/** Same as remainingMs() in ticks, rounded up so any time left never reads zero. */
export function remainingTicks(player: Player, abilityKey: string): number {
  return Math.ceil(remainingMs(player, abilityKey) / MS_PER_TICK);
}

export function isReady(player: Player, abilityKey: string): boolean {
  return remainingMs(player, abilityKey) === 0;
}

/**
 * Arms the full cooldown of `abilityKey` from now. Length comes from the
 * registry; an unregistered key gets the standard 30 s.
 */
export function startCooldown(player: Player, abilityKey: string): void {
  const ticks = defForAbility(abilityKey)?.cooldownTicks ?? COOLDOWN_TICKS;
  player.setDynamicProperty(cooldownKey(abilityKey), nowMs() + ticks * MS_PER_TICK);
}

/** Cancels a running cooldown — the ability is ready again at once. */
export function clearCooldown(player: Player, abilityKey: string): void {
  player.setDynamicProperty(cooldownKey(abilityKey), undefined);
}

/**
 * Marks `abilityKey` busy for `durationMs`. A deadline rather than a flag, so
 * a crash mid-flight cannot leave the ability busy forever.
 */
export function setBusy(player: Player, abilityKey: string, durationMs: number): void {
  player.setDynamicProperty(busyKey(abilityKey), nowMs() + durationMs);
}

export function clearBusy(player: Player, abilityKey: string): void {
  player.setDynamicProperty(busyKey(abilityKey), undefined);
}

export function isBusy(player: Player, abilityKey: string): boolean {
  return readMs(player, busyKey(abilityKey)) > nowMs();
}
