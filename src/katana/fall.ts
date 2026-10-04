// Dragon Katana one-shot fall protection (spec §7; L0-adr-ktfl, L0-katn-p002). Stable 2.10.0 has no
// damage before-event, so nothing here touches damage: just before the landing the player is teleported
// onto its own spot, which zeroes the stored fall (KATA-PROBE-01 P1). Deviations: README.md (C-16).

import { type BlockRaycastHit, EntityComponentTypes, type Player, type Vector3, system } from "@minecraft/server";
import { type Activation, observeActivations } from "./activation";
import { TRACE_FLAGS } from "./plan";

/** L0-xasm20: a flag that sees no landing is dropped this long after the jump. */
export const FALL_FLAG_MS = 10_000;
/**
 * A drop from rest shorter than this deals no fall damage. A self-teleport
 * that leaves a longer drop keeps the flag for a second one (README, C-16).
 */
export const SAFE_DROP = 3;
/**
 * A teleported player keeps reading A's isOnGround for two more ticks (measured:
 * true at +1 and +2 at B 15 blocks up, falling from +3). The other state flags
 * come from the same movement tick.
 */
const STALE_TICKS = 2;
/** isOnGround counts only with a solid this close under the hitbox; it is not trusted alone. */
const GROUND_GAP = 0.75;
/** The hitbox is 0.6 wide; corner rays start just inside it, so never inside a wall. */
const CORNER = 0.29;
const LAVA: ReadonlySet<string> = new Set(["minecraft:lava", "minecraft:flowing_lava"]);
const DOWN: Vector3 = { x: 0, y: -1, z: 0 };

interface FallFlag {
  readonly player: Player;
  /** Epoch ms. */
  readonly until: number;
  readonly dimId: string;
  readonly armedTick: number;
}

const flags = new Map<string, FallFlag>();
let handle: number | undefined;
let watching = true;

const log = (msg: string): void => console.warn(`[andrew] katana: ${msg}`);

function startWatch(): void {
  if (watching && flags.size > 0) handle ??= system.runInterval(tickFallFlags, 1);
}

function stopWatch(): void {
  if (handle !== undefined) system.clearRun(handle);
  handle = undefined;
}

/** Arms the one-shot flag for the landing after a jump to `dimId`. A new jump replaces the old flag. */
export function armFallFlag(player: Player, dimId: string): void {
  flags.set(player.id, { player, until: Date.now() + FALL_FLAG_MS, dimId, armedTick: system.currentTick });
  startWatch();
}

export function hasFallFlag(player: Player): boolean {
  return flags.has(player.id);
}

export function fallFlagCount(): number {
  return flags.size;
}

export function fallWatchRunning(): boolean {
  return handle !== undefined;
}

/**
 * Test seam for the in-test negative control (L0-katn-ac05): while off, jumps
 * still arm flags but no watcher runs. Turning it back on watches what is left.
 */
export function setFallWatch(on: boolean): void {
  watching = on;
  if (on) startWatch();
  else stopWatch();
}

function isDead(player: Player): boolean {
  const health = player.getComponent(EntityComponentTypes.Health);
  return health !== undefined && health.currentValue <= 0;
}

function inLava(player: Player): boolean {
  for (const at of [player.location, player.getHeadLocation()]) {
    try {
      const id = player.dimension.getBlock(at)?.typeId;
      if (id !== undefined && LAVA.has(id)) return true;
    } catch {
      // An unreadable cell is not lava.
    }
  }
  return false;
}

/**
 * How far the feet are above the highest solid under the hitbox, within
 * `lookAhead`; undefined when there is none that close. A part-block entered
 * mid-cell is caught only as the ray leaves its cell (KATA-PROBE-01 P3), so
 * every ray runs two cells past the look-ahead.
 */
function dropBelow(player: Player, lookAhead: number): number | undefined {
  const { x, y, z } = player.location;
  const steps = Math.ceil(lookAhead) + 2;
  let drop: number | undefined;
  for (const [dx, dz] of [[0, 0], [CORNER, CORNER], [CORNER, -CORNER], [-CORNER, CORNER], [-CORNER, -CORNER]]) {
    let hit: BlockRaycastHit | undefined;
    try {
      hit = player.dimension.getBlockFromRay({ x: x + dx, y, z: z + dz }, DOWN, { ...TRACE_FLAGS, maxDistance: steps });
    } catch {
      continue;
    }
    if (hit === undefined) continue;
    // faceLocation is the hit's fractional part: a full Up face reads 0, not 1.
    const top = hit.block.location.y + (hit.faceLocation.y === 0 ? 1 : hit.faceLocation.y);
    const d = y - top;
    if (d < lookAhead && (drop === undefined || d < drop)) drop = d;
  }
  return drop;
}

/** One watcher pass over one flag: why it ends, or undefined to keep it. */
function step(flag: FallFlag, now: number, tick: number): string | undefined {
  const player = flag.player;
  if (!player.isValid) return "gone";
  if (now > flag.until) return "expired with no landing";
  if (isDead(player)) return "dead";
  if (player.dimension.id !== flag.dimId) return "dimension";
  if (tick <= flag.armedTick + STALE_TICKS) return undefined;
  if (player.isOnGround && dropBelow(player, GROUND_GAP) !== undefined) return "on the ground";
  if (player.isInWater) return "in water";
  if (inLava(player)) return "in lava";
  if (player.isClimbing) return "climbing";
  if (player.isGliding) return "gliding";
  const vy = player.getVelocity().y;
  if (vy >= 0) return undefined;
  // L0-katn-as04: never less than one tick of fall ahead, so no tick skips past the ground.
  const lookAhead = Math.max(2, Math.ceil(-vy) + 1);
  const drop = dropBelow(player, lookAhead);
  if (drop === undefined) return undefined;
  player.teleport(player.location, { rotation: player.getRotation() });
  const left = `fall reset ${drop.toFixed(2)} above the ground at vy ${vy.toFixed(2)} (look-ahead ${lookAhead})`;
  if (drop < SAFE_DROP) return left;
  log(`${player.name}: ${left}, kept for a second reset`);
  return undefined;
}

function tickFallFlags(): void {
  const now = Date.now();
  const tick = system.currentTick;
  for (const [id, flag] of flags) {
    let reason: string | undefined;
    try {
      reason = step(flag, now, tick);
    } catch (err) {
      reason = `the watcher threw ${String(err)}`;
    }
    if (reason === undefined) continue;
    flags.delete(id);
    const name = flag.player.isValid ? flag.player.name : id;
    if (reason !== "gone") log(`${name}: fall flag ended +${tick - flag.armedTick} ticks: ${reason}`);
  }
  if (flags.size === 0) stopWatch();
}

export function registerFallProtection(): void {
  observeActivations((activation: Activation) => {
    if (activation.jumped) armFallFlag(activation.player, activation.dimensionId);
  });
}
