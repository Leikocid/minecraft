// Above-Water Trident movement on the engine (spec §02 items 2–3; L0-trdt-pmov, L0-adr-twrp): the
// sneaking-release dash, the one-shot fall cancel after it, and the swim boost while held. The plain
// release is the throw's (L0-trdt-pthr), never handled here. Limits of stable 2.10.0 (C-16): no
// API plays the Riptide spin pose, and Bedrock has no Dolphin's Grace, so the boost is a per-tick
// impulse (docs/feedback/probe-trident.md §6).

import {
  EntityComponentTypes,
  EntityDamageCause,
  type Entity,
  EquipmentSlot,
  type ItemReleaseUseAfterEvent,
  type ItemStack,
  type Player,
  system,
  world,
} from "@minecraft/server";
import { TRIDENT } from "../legendary/registry";
import { isItemOf, isStale } from "../legendary/state";
import {
  type FallGrant,
  RIPTIDE_SOUND,
  chargeTicks,
  dashImpulse,
  grantLive,
  newGrant,
  releaseDecision,
  stepGrant,
  swimKick,
} from "./movement-rules";

export interface MovementStats {
  dashes: number;
  /** Fall damage each cancelled landing would have dealt, in order. */
  readonly cancelled: number[];
  landed: number;
  expired: number;
  kicks: number;
  lastKickTick: number;
}

interface GrantEntry {
  readonly player: Player;
  grant: FallGrant;
}

const grants = new Map<string, GrantEntry>();
const stats = new Map<string, MovementStats>();
let registered = false;

const log = (msg: string): void => console.warn(`[andrew] trident: ${msg}`);
const f2 = (n: number): string => n.toFixed(2);

function statsFor(id: string): MovementStats {
  let s = stats.get(id);
  if (s === undefined) {
    s = { dashes: 0, cancelled: [], landed: 0, expired: 0, kicks: 0, lastKickTick: -1 };
    stats.set(id, s);
  }
  return s;
}

/** Test seam: what this module did to one player since it joined. */
export function movementStats(playerId: string): Readonly<MovementStats> {
  return statsFor(playerId);
}

export function hasFallGrant(playerId: string): boolean {
  const entry = grants.get(playerId);
  return entry !== undefined && grantLive(entry.grant, system.currentTick);
}

/** A copy the framework has superseded is no weapon (R-lgnd-005); an unmarked Creative copy is. */
function isLiveTrident(stack: ItemStack | undefined): boolean {
  return isItemOf(TRIDENT, stack) && !isStale(TRIDENT, stack);
}

function holdsTrident(player: Player): boolean {
  const equippable = player.getComponent(EntityComponentTypes.Equippable);
  if (equippable === undefined) return false;
  return isLiveTrident(equippable.getEquipment(EquipmentSlot.Mainhand)) || isLiveTrident(equippable.getEquipment(EquipmentSlot.Offhand));
}

/** Launches `player` along its view like Riptide III and arms the one-shot fall grant. No cooldown, no world check. */
export function dash(player: Player): void {
  const view = player.getViewDirection();
  const { horizontal, vertical } = dashImpulse(view);
  player.applyKnockback(horizontal, vertical);
  try {
    player.dimension.playSound(RIPTIDE_SOUND, player.location);
  } catch (err) {
    log(`riptide sound threw ${String(err)}`);
  }
  grants.set(player.id, { player, grant: newGrant(system.currentTick) });
  const s = statsFor(player.id);
  s.dashes++;
  log(`${player.name} dash #${s.dashes} in ${player.dimension.id} view ${f2(view.x)},${f2(view.y)},${f2(view.z)}`);
}

function onRelease(event: ItemReleaseUseAfterEvent): void {
  // A SimulatedPlayer reaches a pack without @minecraft/server-gametest as undefined.
  const player: Player | undefined = event.source;
  if (player === undefined || !player.isValid) return;
  // isSneaking is the live value, not the one at release: a sneak let go in the same tick reads false
  // and the release goes to the throw (probe §3).
  const decision = releaseDecision({
    trident: isLiveTrident(event.itemStack),
    sneaking: player.isSneaking,
    charge: chargeTicks(event.useDuration),
  });
  if (decision === "dash") dash(player);
}

function isDead(player: Player): boolean {
  const health = player.getComponent(EntityComponentTypes.Health);
  return health !== undefined && health.currentValue <= 0;
}

function tickGrants(tick: number): void {
  for (const [id, entry] of grants) {
    const player = entry.player;
    if (!player.isValid || isDead(player)) {
      grants.delete(id);
      continue;
    }
    const step = stepGrant(entry.grant, { tick, contact: player.isOnGround || player.isInWater || player.isClimbing });
    entry.grant = step.grant;
    if (step.end === undefined) continue;
    grants.delete(id);
    const s = statsFor(id);
    if (step.end === "landed") s.landed++;
    else s.expired++;
    log(`${player.name} fall grant ended +${tick - step.grant.armedTick} ticks: ${step.end} without a fall hurt`);
  }
}

function tickSwim(tick: number): void {
  for (const player of world.getAllPlayers()) {
    // A SimulatedPlayer reaches a pack without @minecraft/server-gametest as an unreadable entry.
    if (player?.isValid !== true || !player.isInWater || !holdsTrident(player)) continue;
    const velocity = player.getVelocity();
    const kick = swimKick({ holding: true, inWater: true, swimming: player.isSwimming, velocity, view: player.getViewDirection() });
    if (kick === undefined) continue;
    // A vertical strength equal to the current vy leaves the vertical motion as it is (probe §4, §6).
    player.applyKnockback(kick, velocity.y);
    const s = statsFor(player.id);
    s.kicks++;
    s.lastKickTick = tick;
  }
}

function tickMovement(): void {
  const tick = system.currentTick;
  try {
    tickGrants(tick);
  } catch (err) {
    log(`fall grant tick threw ${String(err)}`);
  }
  try {
    tickSwim(tick);
  } catch (err) {
    log(`swim tick threw ${String(err)}`);
  }
}

export function registerTridentMovement(): void {
  if (registered) return;
  registered = true;
  world.afterEvents.itemReleaseUse.subscribe(onRelease);
  world.beforeEvents.entityHurt.subscribe((event) => {
    if (event.damageSource.cause !== EntityDamageCause.fall) return;
    const target: Entity | undefined = event.hurtEntity;
    if (target === undefined) return;
    const entry = grants.get(target.id);
    if (entry === undefined || !grantLive(entry.grant, system.currentTick)) return;
    event.cancel = true;
    grants.delete(target.id);
    statsFor(target.id).cancelled.push(event.damage);
    log(`${entry.player.name} fall ${f2(event.damage)} cancelled +${system.currentTick - entry.grant.armedTick} ticks after the dash`);
  });
  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    grants.delete(playerId);
    stats.delete(playerId);
  });
  system.runInterval(tickMovement, 1);
}
