// The per-tick hold (L0-magn-phld): players with iron in a hand are pulled by
// knockback toward the hold point under the saucer (L0-magn-rply); every other
// element is teleported toward its slot on the cloud ring and its velocity
// cleared (L0-magn-rrng), so it neither falls nor collides (U3). Engine objects
// come in as arguments, so node tests run a whole step over fakes.

import type { Entity, EquipmentSlot, GameMode, ItemStack, Player, Vector3 } from "@minecraft/server";
import { isIronItem } from "./iron";
import { type ElementClass, type Zone, inZone } from "./magnet-select";

/** UFO §6: players hang this far below the saucer, on its axis. */
export const PLAYER_DEPTH = 6;
/** UFO §6: blocks per tick, at most. */
export const PLAYER_SPEED = 0.6;
/** UFO §6: the cloud ring. */
export const RING_RADIUS = 5;
export const RING_DEPTH = 3;
/** L0-magn-asfl: an element's step toward its slot, at most. */
export const FLIGHT_SPEED = 1.5;
/** L0-magn-asrg: an item is kept this far from every player's body (U11: pickup at ~2). */
export const KEEP_AWAY = 3;
/** One turn of the ring in 20 s: the slow circling of §6. */
export const RING_TURN_TICKS = 400;
/** The keep-away measures from the middle of a standing player, not the feet. */
export const BODY_MIDDLE = 0.9;
/** How far the keep-away may push a point outward, then upward, before it gives up. */
const PUSH_STEP = 0.5;
const PUSH_STEPS = (2 * KEEP_AWAY) / PUSH_STEP;

/** An exempt drop (L0-magn-rexm): iron that spawned near the saucer during the magnet. */
export const EXEMPT = "X";
export type HeldClass = ElementClass | typeof EXEMPT;

const ITEM = "minecraft:item";
const HANDS = ["Mainhand", "Offhand"] as EquipmentSlot[];
const CREATIVE = "Creative" as GameMode;
const SPECTATOR = "Spectator" as GameMode;

/** L0-magn-eelm; memory only (C-23). */
export interface HeldElement {
  readonly entity: Entity;
  readonly cls: HeldClass;
  readonly from: string;
  readonly origin: Vector3;
  /** Its ring place; the ring is spaced over every slot handed out so far. */
  readonly slot: number;
  /** Within one flight step of its slot at the last step. */
  arrived: boolean;
  /** An item entity, the one kind kept away from players; read once. */
  item?: boolean;
}

export type HeldPlayer = Pick<Player, "id" | "name" | "isValid" | "location" | "getGameMode" | "getComponent" | "applyKnockback">;

const sub = (a: Vector3, b: Vector3): Vector3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const distance = (a: Vector3, b: Vector3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export function holdPoint(saucer: Vector3): Vector3 {
  return { x: saucer.x, y: saucer.y - PLAYER_DEPTH, z: saucer.z };
}

/** The displacement toward `to`, at most `speed` long; zero at the target. */
export function pullStep(from: Vector3, to: Vector3, speed: number): Vector3 {
  const d = sub(to, from);
  const len = Math.hypot(d.x, d.y, d.z);
  if (len < 1e-9) return { x: 0, y: 0, z: 0 };
  const k = Math.min(speed, len) / len;
  return { x: d.x * k, y: d.y * k, z: d.z * k };
}

export function stepToward(from: Vector3, to: Vector3, speed: number): Vector3 {
  const v = pullStep(from, to, speed);
  return { x: from.x + v.x, y: from.y + v.y, z: from.z + v.z };
}

export function ringAngle(slot: number, slots: number, tick: number): number {
  return (2 * Math.PI * slot) / Math.max(1, slots) + (2 * Math.PI * tick) / RING_TURN_TICKS;
}

export function ringPoint(saucer: Vector3, slot: number, slots: number, tick: number): Vector3 {
  const a = ringAngle(slot, slots, tick);
  return { x: saucer.x + RING_RADIUS * Math.cos(a), y: saucer.y - RING_DEPTH, z: saucer.z + RING_RADIUS * Math.sin(a) };
}

const clearOf = (p: Vector3, bodies: readonly Vector3[], margin: number): boolean => bodies.every((b) => distance(p, b) >= margin);

/**
 * L0-magn-rrng keep-away: a point within `margin` of a player's body moves
 * radially outward from the saucer's axis until clear, else upward. `dir` is
 * the way out for a point that sits on the axis itself.
 */
export function keepAway(p: Vector3, axis: Vector3, bodies: readonly Vector3[], dir: { x: number; z: number }, margin = KEEP_AWAY): Vector3 {
  if (clearOf(p, bodies, margin)) return p;
  let dx = p.x - axis.x;
  let dz = p.z - axis.z;
  let r = Math.hypot(dx, dz);
  if (r < PUSH_STEP) {
    const n = Math.hypot(dir.x, dir.z) || 1;
    dx = dir.x / n;
    dz = dir.z / n;
    r = 0;
  } else {
    dx /= r;
    dz /= r;
  }
  for (let k = 1; k <= PUSH_STEPS; k++) {
    const q = { x: axis.x + dx * (r + k * PUSH_STEP), y: p.y, z: axis.z + dz * (r + k * PUSH_STEP) };
    if (clearOf(q, bodies, margin)) return q;
  }
  for (let k = 1; k <= PUSH_STEPS; k++) {
    const q = { x: p.x, y: p.y + k * PUSH_STEP, z: p.z };
    if (clearOf(q, bodies, margin)) return q;
  }
  return { x: p.x, y: p.y + PUSH_STEPS * PUSH_STEP, z: p.z };
}

/** The iron stack in the main or off hand; a legendary is never iron. Inventory and armour do not count. */
export function ironInHand(player: HeldPlayer, isLegendary: (s: ItemStack) => boolean): ItemStack | undefined {
  const equippable = player.getComponent("minecraft:equippable");
  if (equippable === undefined) return undefined;
  for (const slot of HANDS) {
    const stack = equippable.getEquipment(slot);
    if (stack !== undefined && isIronItem(stack.typeId) && !isLegendary(stack)) return stack;
  }
  return undefined;
}

/** L0-magn-rply, re-read every tick: alive, in the zone, not Creative or Spectator, iron in a hand. */
export function pullsPlayer(player: HeldPlayer, zone: Zone, isLegendary: (s: ItemStack) => boolean): boolean {
  return player.isValid && pulls(player, player.getGameMode(), player.location, zone, isLegendary);
}

/** pullsPlayer for a valid player whose mode and location are already read; the cheap tests go first. */
function pulls(player: HeldPlayer, mode: GameMode, at: Vector3, zone: Zone, isLegendary: (s: ItemStack) => boolean): boolean {
  if (mode === CREATIVE || mode === SPECTATOR || !inZone(zone, at)) return false;
  if (ironInHand(player, isLegendary) === undefined) return false;
  // A dead player stays listed, with health 0, until it respawns.
  const health = player.getComponent("minecraft:health")?.currentValue;
  return health === undefined || health > 0;
}

const CHUNK = 16;
const sameChunk = (a: Vector3, b: Vector3): boolean => Math.floor(a.x / CHUNK) === Math.floor(b.x / CHUNK) && Math.floor(a.z / CHUNK) === Math.floor(b.z / CHUNK);

export interface HoldInput {
  /** This tick's saucer position. */
  readonly saucer: Vector3;
  readonly zone: Zone;
  /** Steps since magnet-on: the ring's rotation. */
  readonly tick: number;
  /** Slots handed out so far; the ring is spaced over all of them. */
  readonly slots: number;
  readonly players: Iterable<HeldPlayer | undefined>;
  /** Mutated: an element whose entity is gone is taken out and its slot stays empty. */
  readonly elements: HeldElement[];
  isLegendary(stack: ItemStack): boolean;
  /** Dimension.isChunkLoaded: nothing is moved into an unloaded chunk (C-12′). */
  isLoaded(at: Vector3): boolean;
}

export interface HoldReport {
  /** Ids of the players knocked toward the hold point this tick. */
  readonly pulled: string[];
  readonly moved: number;
  /** Elements left where they are this tick: the step would end in an unloaded chunk. */
  readonly skipped: number;
  /** Elements taken out of the set this tick. */
  readonly gone: number;
  readonly errors: string[];
}

const errText = (err: unknown): string => (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).split("\n")[0];

export function holdStep(input: HoldInput): HoldReport {
  const S = input.saucer;
  const target = holdPoint(S);
  const pulled: string[] = [];
  const errors: string[] = [];
  const bodies: Vector3[] = [];
  for (const p of input.players) {
    if (p === undefined) continue;
    try {
      if (!p.isValid) continue;
      const mode = p.getGameMode();
      const loc = p.location;
      if (mode !== SPECTATOR) bodies.push({ x: loc.x, y: loc.y + BODY_MIDDLE, z: loc.z });
      if (!pulls(p, mode, loc, input.zone, input.isLegendary)) continue;
      const v = pullStep(loc, target, PLAYER_SPEED);
      // U1: holds within ~0.03 of the target; at the target the step is zero.
      p.applyKnockback({ x: v.x, z: v.z }, v.y);
      pulled.push(p.id);
    } catch (err) {
      errors.push(`player ${p.id}: ${errText(err)}`);
    }
  }

  let moved = 0;
  let skipped = 0;
  let gone = 0;
  const els = input.elements;
  for (let i = 0; i < els.length; i++) {
    const el = els[i];
    if (!el.entity.isValid) {
      els.splice(i--, 1);
      gone++;
      continue;
    }
    try {
      const at = el.entity.location;
      const angle = ringAngle(el.slot, input.slots, input.tick);
      const out = { x: Math.cos(angle), z: Math.sin(angle) };
      const item = (el.item ??= el.entity.typeId === ITEM);
      let slot = ringPoint(S, el.slot, input.slots, input.tick);
      if (item) slot = keepAway(slot, S, bodies, out);
      let next = stepToward(at, slot, FLIGHT_SPEED);
      if (item) next = keepAway(next, S, bodies, out);
      // The entity's own chunk is loaded, or it would not be valid.
      if (!sameChunk(at, next) && !input.isLoaded(next)) {
        skipped++;
        continue;
      }
      el.entity.teleport(next);
      el.entity.clearVelocity();
      el.arrived = distance(next, slot) < 1e-6;
      moved++;
    } catch (err) {
      errors.push(`element ${el.from} ${el.entity.id}: ${errText(err)}`);
    }
  }
  return { pulled, moved, skipped, gone, errors };
}
