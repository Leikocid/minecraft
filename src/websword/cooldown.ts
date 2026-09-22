// Cooldown service for the Web Sword ability (spec §8; Q-009 persistence;
// ADR-007 ability-key seam).
//
// Owns every write to the ability's cooldown timer. WS-TRAP-01 is the only
// caller allowed to arm it: it reads isReady() before placing a cell and calls
// startCooldown() only after that placement succeeds. This module never
// listens for the use-event itself and never decides whether an activation
// succeeded — it only keeps the clock. [src: KV L0 ADR-017 — 'L0-cool даёт
// read-only isReady(), L0-trap вызывает его и таймер не пишет']
//
// One-way dependency: this file imports state.ts and rules.ts only, never
// trap.ts or craftgate.ts.

import {
  EntityComponentTypes,
  EquipmentSlot,
  type Player,
  system,
  world,
} from "@minecraft/server";
import { COOLDOWN_TICKS, cooldownRemaining } from "./rules";
import { getCooldownUntil, isWebSword, setCooldownUntil } from "./state";

/**
 * Ability-key seam (ADR-007, Q-010): the Web Sword registers one key today,
 * and every export below accepts it as a parameter so a future legendary item
 * can pass its own without an API change. Main-hand/off-hand priority between
 * two ability keys is explicitly deferred (Q-010) and is not implemented
 * here — state.ts stores one cooldown slot per player, which is all a single
 * registered ability needs.
 */
export const DEFAULT_ABILITY_KEY = "web_sword";

/** Whether `player`'s cooldown for `abilityKey` has expired. Never mutates state. */
export function isReady(player: Player, abilityKey: string = DEFAULT_ABILITY_KEY): boolean {
  return remainingTicks(player, abilityKey) === 0;
}

/**
 * Arms the cooldown: `abilityKey` becomes ready again exactly COOLDOWN_TICKS
 * (30s) from now. Caller's responsibility (WS-TRAP-01) to call this only after
 * a confirmed successful activation — this function does not check readiness
 * itself, it only starts the clock.
 */
export function startCooldown(player: Player, _abilityKey: string = DEFAULT_ABILITY_KEY): void {
  // _abilityKey is accepted for the seam above but not yet threaded into
  // storage — there is exactly one registered ability, so a per-key argument
  // would exercise a path no caller can reach.
  setCooldownUntil(player, world.getAbsoluteTime() + COOLDOWN_TICKS);
}

/** Ticks remaining until `player`'s cooldown for `abilityKey` ends, clamped to zero. */
export function remainingTicks(player: Player, _abilityKey: string = DEFAULT_ABILITY_KEY): number {
  return cooldownRemaining(world.getAbsoluteTime(), getCooldownUntil(player));
}

/** How often the HUD recomputes and (re)renders the actionbar. */
const HUD_INTERVAL_TICKS = 10;

/** 20 ticks per second — the same constant `COOLDOWN_TICKS` is built from. */
const TICKS_PER_SECOND = 20;

/**
 * Renders the cooldown countdown to the actionbar of every player currently
 * holding the Web Sword in their main hand.
 *
 * Scoped to `world.getAllPlayers()` — never a block/entity scan — so the cost
 * is proportional to the number of online players, not the world [src:
 * webswordspecv1ruen §11].
 */
export function registerCooldownHud(): void {
  system.runInterval(() => {
    for (const entry of world.getAllPlayers()) {
      // Typed non-nullable, and for a real player it is. A SimulatedPlayer
      // arrives as undefined in a pack that does not load the beta gametest
      // module: getAllPlayers() returns the right *count* and no readable
      // entries. Without the guard every gametest run buries the log under one
      // TypeError per player per HUD interval — 162 of them in the WS-TRAP-01
      // run that found this. [src: concept-constraint C-2]
      const player: Player | undefined = entry;
      if (player === undefined) {
        continue;
      }
      renderFor(player);
    }
  }, HUD_INTERVAL_TICKS);

  console.warn("[andrew] web sword cooldown hud armed");
}

function renderFor(player: Player): void {
  const held = player
    .getComponent(EntityComponentTypes.Equippable)
    ?.getEquipment(EquipmentSlot.Mainhand);
  if (!isWebSword(held)) {
    // No message at all for a player without the sword in hand — not even a
    // cleared actionbar, which would fight over the bar with anything else
    // writing to it. [src: webswordspecv1ruen §8]
    return;
  }

  const now = world.getAbsoluteTime();
  const until = getCooldownUntil(player);
  const remaining = cooldownRemaining(now, until);

  if (remaining > 0) {
    const seconds = Math.ceil(remaining / TICKS_PER_SECOND);
    player.onScreenDisplay.setActionBar({
      translate: "andrew.web_sword.cooldown",
      with: [String(seconds)],
    });
    return;
  }

  // Cooldown is not running. Only announce "ready" once, in the first render
  // pass after it actually ended — `until` is durable and stays in the past
  // forever afterward, so without this window every later tick would repeat
  // the message for as long as the sword stays in hand.
  if (until > 0 && now - until < HUD_INTERVAL_TICKS) {
    player.onScreenDisplay.setActionBar({ translate: "andrew.web_sword.ready" });
  }
}
