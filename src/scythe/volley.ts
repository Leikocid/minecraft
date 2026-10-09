// The Scythe's volley (spec §4–5): three homing projectiles that exist only
// as positions in this script [src: decision-scythe-projectiles]. No entity is
// ever spawned, so blocks are never touched and nothing is left behind when
// the target dies, leaves or changes dimension. Decisions live in
// volley-rules.ts; this file moves, draws, hits and keeps the clocks.

import { EntityDamageCause, type Entity, type Player, type Vector3, system } from "@minecraft/server";

/** A name for the log that works for a player and for a cow alike. */
function label(entity: Entity): string {
  return entity.nameTag !== "" ? entity.nameTag : entity.typeId;
}
import { clearBusy, setBusy, startCooldown } from "../legendary/cooldown";
import { SCYTHE_OF_CALAMITY } from "../legendary/registry";
import { applyScriptedDamage } from "../legendary/scripted-damage";
import { registerScytheTargeting } from "./targeting";
import {
  type EndReason,
  PROJECTILE_COUNT,
  TRUE_DAMAGE,
  VOLLEY_TIMEOUT_TICKS,
  aimPoint,
  cooldownVerdict,
  isHit,
  launchTick,
  outOfRadius,
  stepTowards,
  strikePlan,
  trueDamageOutcome,
} from "./volley-rules";

/**
 * Vertical strength handed to applyKnockback on each hit; the spec asks for
 * ~10 blocks. The engine takes it as the initial vertical velocity in blocks
 * per tick (gravity 0.08, drag 0.98): on BDS 1.26.51.1 the GameTest
 * andrew:scythe_launches_target measured 2.5 -> +29.29 blocks, exactly what
 * that model predicts, and the model puts 1.35 at +10.1.
 */
export const LAUNCH_STRENGTH = 1.35;

/** End-rod sparks: a white homing trail close to a Shulker Bullet's. Rendering is client-side only. */
export const PROJECTILE_PARTICLE = "minecraft:endrod";

const MS_PER_TICK = 50;

/** Owner busy for the whole flight plus slack; cleared on every end, so this is only the crash bound. */
const BUSY_MS = (VOLLEY_TIMEOUT_TICKS + 20) * MS_PER_TICK;

export interface VolleyObserver {
  onHit?(hitNumber: number, targetHpAfter: number): void;
  onEnd?(reason: EndReason, hits: number): void;
}

interface Projectile {
  position: Vector3;
}

interface Volley {
  owner: Player;
  ownerId: string;
  target: Entity;
  dimensionId: string;
  launchPoint: Vector3;
  age: number;
  fired: number;
  hits: number;
  flying: Projectile[];
  runId: number;
  observer: VolleyObserver | undefined;
}

const active = new Map<string, Volley>();
let tickErrors = 0;

/** Volleys still in flight. Each holds exactly one interval, so this also counts live intervals. */
export function activeVolleyCount(): number {
  return active.size;
}

/** Projectiles in flight across every volley. */
export function activeProjectileCount(): number {
  let n = 0;
  for (const v of active.values()) {
    n += v.flying.length;
  }
  return n;
}

/** Exceptions caught inside volley ticks since script load. */
export function volleyTickErrors(): number {
  return tickErrors;
}

function at(v: Vector3): string {
  return `${v.x.toFixed(1)},${v.y.toFixed(1)},${v.z.toFixed(1)}`;
}

/** Health of a live, same-dimension target, or undefined when it no longer is one. */
function liveHealth(volley: Volley): number | undefined {
  const target = volley.target;
  if (!target.isValid || target.dimension.id !== volley.dimensionId) {
    return undefined;
  }
  const hp = target.getComponent("minecraft:health")?.currentValue;
  return hp !== undefined && hp > 0 ? hp : undefined;
}

function launchOrigin(volley: Volley): Vector3 {
  if (volley.owner.isValid && volley.owner.dimension.id === volley.dimensionId) {
    const from = volley.owner.location;
    return { x: from.x, y: from.y + 1.2, z: from.z };
  }
  return { x: volley.launchPoint.x, y: volley.launchPoint.y + 1.2, z: volley.launchPoint.z };
}

/** Stable 2.10.0 cannot read the shield of hearts; the effect is the only sign of it. */
function absorbing(entity: Entity): boolean {
  try {
    return entity.getEffect("absorption") !== undefined;
  } catch {
    return false;
  }
}

/** Applies one hit: exactly 3 HP past armour, then the launch [src: decision-scythe-true-damage, decision-scythe-launch]. */
function strike(volley: Volley, hp: number): void {
  const target = volley.target;
  const damagingEntity = volley.owner.isValid ? volley.owner : undefined;
  const plan = strikePlan(hp, absorbing(target));
  if (plan.kind === "lethal") {
    // Overkill through the damage pipeline, so the death message, the owner's
    // kill credit and a totem all work; armour cannot soak hp + 100. The cause
    // is sonicBoom: a shield raised toward the wielder cancels a scripted
    // entityAttack outright, and the target then cannot be finished at all.
    applyScriptedDamage(target, hp + 100, { cause: EntityDamageCause.sonicBoom, damagingEntity });
  } else {
    if (plan.kind === "damage-then-write") {
      // What the player sees and hears — the red flash, the hurt sound, a mob
      // turning on its attacker. A bare write has none of it and reads in game
      // as "the projectiles do nothing".
      applyScriptedDamage(target, TRUE_DAMAGE, { cause: EntityDamageCause.entityAttack, damagingEntity });
    }
    // The write is what makes the total exactly TRUE_DAMAGE whatever armour or
    // Protection absorbed, and it also covers the ticks where the engine's
    // invulnerability window swallows the damage event outright.
    target.getComponent("minecraft:health")?.setCurrentValue(plan.goal);
  }
  volley.hits++;
  if (target.isValid) {
    target.applyKnockback({ x: 0, z: 0 }, LAUNCH_STRENGTH);
  }
  const after = volley.target.isValid ? (target.getComponent("minecraft:health")?.currentValue ?? 0) : 0;
  console.warn(
    `[andrew] scythe volley: hit ${volley.hits} on ${label(target)} hp ${hp} -> ${after} (true ${TRUE_DAMAGE}) at ${at(target.location)}`
  );
  volley.observer?.onHit?.(volley.hits, after);
}

function end(volley: Volley, reason: EndReason): void {
  system.clearRun(volley.runId);
  volley.flying = [];
  if (active.get(volley.ownerId) === volley) {
    active.delete(volley.ownerId);
  }
  const verdict = cooldownVerdict(volley.hits, reason);
  if (volley.owner.isValid) {
    clearBusy(volley.owner, SCYTHE_OF_CALAMITY.abilityKey);
    // Re-armed from the end, so a hit early in a long flight still costs a full 30 s.
    if (verdict === "full") {
      startCooldown(volley.owner, SCYTHE_OF_CALAMITY.abilityKey);
    }
  }
  console.warn(
    `[andrew] scythe volley: end ${reason} after ${volley.age} ticks, hits=${volley.hits}, cooldown=${verdict}`
  );
  volley.observer?.onEnd?.(reason, volley.hits);
}

/** One tick of flight. Returns the reason the volley ends on this tick, if it does. */
function step(volley: Volley): EndReason | undefined {
  volley.age++;
  if (liveHealth(volley) === undefined) {
    return "target_invalid";
  }
  if (outOfRadius(volley.launchPoint, volley.target.location)) {
    return "out_of_radius";
  }
  if (volley.age > VOLLEY_TIMEOUT_TICKS) {
    return "timeout";
  }

  while (volley.fired < PROJECTILE_COUNT && launchTick(volley.fired) < volley.age) {
    volley.flying.push({ position: launchOrigin(volley) });
    volley.fired++;
  }

  const dimension = volley.target.dimension;
  const remaining: Projectile[] = [];
  for (const projectile of volley.flying) {
    // Re-aimed every tick: the target is tracked, never led.
    const aim = aimPoint(volley.target.location);
    projectile.position = stepTowards(projectile.position, aim);
    if (isHit(projectile.position, aim)) {
      const hp = liveHealth(volley);
      if (hp === undefined) {
        return "target_invalid";
      }
      strike(volley, hp);
      if (liveHealth(volley) === undefined) {
        return "target_invalid";
      }
      continue;
    }
    try {
      dimension.spawnParticle(PROJECTILE_PARTICLE, projectile.position);
    } catch {
      // Unloaded chunk or outside the world: the projectile flies on unseen.
    }
    remaining.push(projectile);
  }
  volley.flying = remaining;

  return volley.fired === PROJECTILE_COUNT && remaining.length === 0 ? "spent" : undefined;
}

/**
 * Starts a volley from `owner` at `target`. Returns false when `owner`
 * already has one in flight. The cooldown is not touched until the volley
 * ends, except that the first hit arms it at once: an owner who logs out
 * mid-flight must not escape a cooldown they already earned (Q-009).
 */
export function launchVolley(owner: Player, target: Entity, observer?: VolleyObserver): boolean {
  if (active.has(owner.id)) {
    return false;
  }
  const launchPoint = { ...owner.location };
  const volley: Volley = {
    owner,
    ownerId: owner.id,
    target,
    dimensionId: owner.dimension.id,
    launchPoint,
    age: 0,
    fired: 0,
    hits: 0,
    flying: [],
    runId: 0,
    observer: {
      onHit(n, hp) {
        if (n === 1 && owner.isValid) {
          startCooldown(owner, SCYTHE_OF_CALAMITY.abilityKey);
        }
        observer?.onHit?.(n, hp);
      },
      onEnd: observer?.onEnd,
    },
  };

  volley.runId = system.runInterval(() => {
    let reason: EndReason | undefined;
    try {
      reason = step(volley);
    } catch (err) {
      tickErrors++;
      console.warn(`[andrew] scythe volley: tick failed: ${String(err)}`);
      reason = "error";
    }
    if (reason !== undefined) {
      end(volley, reason);
    }
  }, 1);
  active.set(owner.id, volley);
  setBusy(owner, SCYTHE_OF_CALAMITY.abilityKey, BUSY_MS);
  console.warn(`[andrew] scythe volley: ${owner.name} -> ${label(target)}, launch point ${at(launchPoint)}`);
  return true;
}

/** Targeting on Use, then a volley at whoever it picked. */
export function registerScytheVolley(): void {
  registerScytheTargeting((owner, target) => {
    if (target !== undefined) {
      launchVolley(owner, target);
    }
  });
}
