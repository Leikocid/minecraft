// The Storm Blade's damage arithmetic (spec §02, §05; L0-strm-rdmg, L0-adr-sbdm R and C), with no engine import:
// tests/storm-damage.test.mjs runs it under node. The formula is the one diagnose-CNTR-X26 fitted to ten armoured
// hits to 0.01; the Resistance factor is probe-storm P2.

/** Active ability, HP before armour (§02). */
export const ACTIVE_DAMAGE = 10;
/** Passive proc, HP before armour on top of the melee (§02). */
export const PASSIVE_DAMAGE = 6;
/**
 * Within this many ticks of the last landed hit, a hit whose post-armour amount is not above that hit's takes 0 and a
 * stronger one only the difference, while applyDamage still returns true (CNTR-X22, X26: k = 1…9 swallowed, 10 full).
 */
export const HURT_WINDOW_TICKS = 10;
/** Raw damage added to hp on the lethal path: through 20 armour, Protection IV ×4 and Resistance IV it still deals > 60. */
export const OVERKILL = 1000;

const MAX_ARMOUR_POINTS = 20;
const MAX_PROTECTION_EPF = 20;
const RESISTANCE_PER_LEVEL = 0.2;
/** Health reads are floats; a write is skipped when the engine already took D′ to this precision. */
const EPSILON = 1e-4;

/** What reduces an entityAttack hit on a target, as the engine exposes it. */
export interface Defence {
  /** `equippable.totalArmor`; 0 where the entity has no equippable (every mob in 2.10.0, probe-storm P2). */
  armor: number;
  /** `equippable.totalToughness`. */
  toughness: number;
  /** Sum of the Protection levels on the four armour slots (EPF). */
  protection: number;
  /** Resistance level, `amplifier + 1`; 0 without the effect. */
  resistance: number;
}

export const NO_DEFENCE: Defence = { armor: 0, toughness: 0, protection: 0, resistance: 0 };

/** Armour and toughness on raw `d`: the share that passes. */
export function armourFactor(d: number, armor: number, toughness: number): number {
  const points = Math.min(MAX_ARMOUR_POINTS, Math.max(armor / 5, armor - d / (2 + toughness / 4)));
  return 1 - points / 25;
}

export function protectionFactor(epf: number): number {
  return 1 - Math.min(MAX_PROTECTION_EPF, Math.max(0, epf)) / 25;
}

/** Resistance V and above is immunity. It multiplies after armour: f(d)·k, not f(d·k) (probe-storm P2). */
export function resistanceFactor(level: number): number {
  return Math.max(0, 1 - RESISTANCE_PER_LEVEL * Math.max(0, level));
}

/** f(d): what a vanilla entityAttack of raw `d` takes from the target after armour, Protection and Resistance. */
export function afterArmour(d: number, defence: Defence): number {
  if (d <= 0) return 0;
  return d * armourFactor(d, defence.armor, defence.toughness) * protectionFactor(defence.protection) * resistanceFactor(defence.resistance);
}

/**
 * The passive's melee raise, decided in beforeEvents.entityHurt from what the event reads (post-armour) and the
 * health left. Inside that event the target's health already reads hp − read (STRM-DMG-01 run: 16 of 16 hits,
 * players and a cow), so `hpLeft` is what the hit leaves. Stable 2.10.0 cannot read absorption, so "lethal" here is
 * by health alone.
 * - `raise`: set the hit to `damage` = read + f(D); one native event, absorption first (X26, probe-storm P2).
 * - `lethal`: leave the hit alone and deliver an overkill applyDamage right after the event. A rewrite that makes the hit
 *   lethal eats a totem and still kills (probe-storm P3, 5 of 5).
 * - `kills-alone`: the melee is lethal by itself; nothing is added, so its own totem rule stands.
 * With an absorption effect the health check means nothing, so the raise is taken: exact unless the hit is lethal
 * and the target holds a totem.
 */
export type RaisePlan = { kind: "raise"; damage: number } | { kind: "lethal" } | { kind: "kills-alone" };

export function planRaise(read: number, hpLeft: number, bonus: number, absorbing: boolean): RaisePlan {
  if (!absorbing) {
    if (hpLeft <= 0) return { kind: "kills-alone" };
    if (bonus >= hpLeft) return { kind: "lethal" };
  }
  return { kind: "raise", damage: read + bonus };
}

/**
 * The active's path (adr-sbdm C):
 * - `native`: no known window, applyDamage(D) alone is exact, and lethal natively;
 * - `window`: applyDamage(D), then the health write to hp − D′ where the window swallowed part of it;
 * - `lethal`: in a window with hp ≤ D′, an overkill applyDamage, since a health write to 0 eats the totem and loses
 *   the kill credit (probe-storm P3).
 * With an absorption effect in a window and hp ≤ D′, the call stays native: an overkill would kill through absorption.
 */
export type StrikePath = "native" | "window" | "lethal";

export function planStrike(hp: number, dPrime: number, inWindow: boolean, absorbing: boolean): StrikePath {
  if (!inWindow) return "native";
  if (hp <= dPrime) return absorbing ? "native" : "lethal";
  return "window";
}

/**
 * The window write's target health, or undefined for no write. `applied` false means a raised shield cancelled the
 * call (CNTR-X27): a write would pass the shield.
 */
export function windowWrite(applied: boolean, hpBefore: number, hpAfter: number, dPrime: number): number | undefined {
  if (!applied) return undefined;
  const goal = hpBefore - dPrime;
  return hpAfter > goal + EPSILON ? goal : undefined;
}

export function inHurtWindow(landedTick: number | undefined, now: number): boolean {
  return landedTick !== undefined && now - landedTick < HURT_WINDOW_TICKS;
}
