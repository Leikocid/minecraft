// The shoot-down (L0-sauc-p002, r001, r004, ad03): the hull an Orbital charge
// is tested against, the smoking fall, and the harmless blast with its reward
// and broadcast. The saucer (saucer.ts) holds the state and calls these.
// Engine objects come in as arguments, so node tests load this module with no
// @minecraft/server stub.

import type { Dimension, ItemStack, RawMessage, Vector3 } from "@minecraft/server";
import type { Attack, Interceptor } from "../orbital/flight";
import type { OffReason } from "./event";

/** R-sauc-1, UFO §8: a vertical cylinder standing on the saucer's position, edges closed (AS-sauc-1); it matches the model. */
export const HULL_RADIUS = 12;
export const HULL_HEIGHT = 6;
/** AS-sauc-2: blocks per tick², from rest; from the hover height the ground comes at about tick 57. */
export const FALL_ACCEL = 0.025;
export const SMOKE_PARTICLE = "minecraft:campfire_tall_smoke_particle";
/** P-sauc-2 step 5 allows at most 4 particle calls per fall tick. */
export const SMOKE_PER_TICK = 4;
export const SMOKE_RADIUS = 8;
export const BLAST_PARTICLE = "minecraft:huge_explosion_emitter";
/** R-sauc-4 item 3: two item entities, once per event. */
export const REWARD: readonly { readonly typeId: string; readonly amount: number }[] = [
  { typeId: "minecraft:diamond", amount: 8 },
  { typeId: "minecraft:totem_of_undying", amount: 1 },
];
export const SHOT_DOWN_TEXT = "andrew.ufo.shot_down";
/** AS-sauc-3: the name when neither a live player nor the attack carries one. */
export const UNKNOWN_SHOOTER = "?";

/**
 * R-sauc-1: whether the vertical segment a charge sweeps in one step, `from`
 * down to `to`, meets the hull of a saucer at `saucer`. The column is the
 * segment's own x/z, so the test is exact at any fall speed.
 */
export function hullHit(saucer: Vector3, from: Vector3, to: Vector3): boolean {
  if (Math.hypot(from.x - saucer.x, from.z - saucer.z) > HULL_RADIUS) return false;
  return Math.max(from.y, to.y) >= saucer.y && Math.min(from.y, to.y) <= saucer.y + HULL_HEIGHT;
}

/** AS-sauc-2: one tick of the fall — gain FALL_ACCEL, then drop by the new speed. */
export function fallStep(y: number, vy: number): { y: number; vy: number } {
  const v = vy + FALL_ACCEL;
  return { y: y - v, vy: v };
}

/**
 * The first cell that is not air under the hull's bottom as it drops from `y`
 * to `ny`: floor(y) − 1 down to floor(ny), top first — the charge's own sweep
 * (L0-orbc-p002 step 3). Liquids are not air, so the blast is on the surface.
 */
export function landingCell(y: number, ny: number, minY: number, isAir: (cellY: number) => boolean): number | undefined {
  const last = Math.max(Math.floor(ny), minY);
  for (let cell = Math.floor(y) - 1; cell >= last; cell--) if (!isAir(cell)) return cell;
  return undefined;
}

/** SMOKE_PER_TICK points on the rim, a little above the bottom, turning with `t`. */
export function smokePoints(at: Vector3, t: number): Vector3[] {
  return Array.from({ length: SMOKE_PER_TICK }, (_, k) => {
    const a = t * 0.4 + (k * 2 * Math.PI) / SMOKE_PER_TICK;
    return { x: at.x + SMOKE_RADIUS * Math.cos(a), y: at.y + 1, z: at.z + SMOKE_RADIUS * Math.sin(a) };
  });
}

export function shotDownMessage(name: string): RawMessage {
  return { rawtext: [{ translate: SHOT_DOWN_TEXT, with: [name] }] };
}

/** What the broadcast reads of a player; `Player` satisfies it. */
export interface ShotPlayer {
  readonly id: string;
  readonly name: string;
  sendMessage(message: RawMessage): void;
}

/** AS-sauc-3: the live name, else the one the attack carries from the shot, else UNKNOWN_SHOOTER. */
export function shooterName(attack: Pick<Attack, "ownerId" | "ownerName">, players: Iterable<ShotPlayer | undefined>): string {
  for (const p of players) {
    if (p !== undefined && p.id === attack.ownerId) return p.name;
  }
  return attack.ownerName ?? UNKNOWN_SHOOTER;
}

/** `ufoc`'s side of the shot (L0-adr-ufpc); `UfoCore` satisfies it. */
export interface ShotCore {
  requestMagnetOff(reason: OffReason): void;
  reportShotDown(info: { eventId: string; ownerId: string; ownerName: string }): void;
}

export interface ShootdownHost {
  /** The Orbital flight's seam (L0-adr-ufoi); returns the unregister. */
  registerInterceptor(interceptor: Interceptor): () => void;
  /** Read at the shot: the core is built after the saucer it owns. */
  core(): ShotCore | undefined;
  /** Every online player: who hears the broadcast, and where the shooter's name is read. */
  players(): Iterable<ShotPlayer | undefined>;
  itemStack(typeId: string, amount: number): ItemStack;
  log(msg: string): void;
}

/** One shoot-down, from the latch to the blast (L0-sauc-ent2). */
export interface ShotRecord {
  readonly eventId: string;
  readonly ownerId: string;
  readonly ownerName: string;
  readonly attackId: string;
  /** The orbital step's tick of the latching charge. */
  readonly tick: number;
  /** The saucer's leg when the latching charge crossed the hull. */
  readonly leg: string;
  readonly at: Vector3;
  /** Charges taken by the hull, the latching one included. */
  absorbed: number;
  vy: number;
  /** Fall steps run. */
  steps: number;
  blasted: boolean;
  blastAt: Vector3 | undefined;
  /** How the fall ended: on the ground, at the step cap, or by the completion guarantee. */
  blastBy: "ground" | "cap" | "end" | undefined;
  /** Players the broadcast reached. */
  told: number;
  /** Reward stacks spawned. */
  rewards: number;
}

const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

/**
 * R-sauc-4 items 2–4 at `at`: the reward and the broadcast. The blast's look and
 * sound are the caller's; nothing here touches a block or an entity's health.
 * Each part runs even if another throws.
 */
export function rewardAndBroadcast(dim: Dimension, at: Vector3, shot: ShotRecord, host: ShootdownHost): void {
  for (const { typeId, amount } of REWARD) {
    try {
      dim.spawnItem(host.itemStack(typeId, amount), at);
      shot.rewards++;
    } catch (err) {
      host.log(`ufo ${shot.eventId}: the reward ${typeId} × ${amount} was not spawned: ${errText(err)}`);
    }
  }
  const message = shotDownMessage(shot.ownerName);
  for (const p of host.players()) {
    if (p === undefined) continue;
    try {
      p.sendMessage(message);
      shot.told++;
    } catch (err) {
      host.log(`ufo ${shot.eventId}: the broadcast to ${p.name} threw ${errText(err)}`);
    }
  }
}
